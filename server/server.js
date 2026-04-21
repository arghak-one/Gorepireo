const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// ==========================================
// CONFIGURATION (NO .env FILE PERMITTED)
// ==========================================
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/gorepireo';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';

// Email Settings
const EMAIL_USER = "gorepireoindia@gmail.com";
const EMAIL_PASS = "frkk nkwj bktn cqss";

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(express.json());
// Serve static files from the production build directory
app.use(express.static(path.join(__dirname, '..', 'dist')));

// ==========================================
// DATABASE CONNECTION
// ==========================================
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ==========================================
// EMAIL TRANSPORTER
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail', // Keep Gmail service or whatever is appropriate
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

// ==========================================
// API ENDPOINTS
// ==========================================

// 1. Register User
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, phone, alt_phone, address, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }

        // Check if user exists
        const userCheck = await pool.query('SELECT * FROM public.users WHERE email = $1', [email.toLowerCase()]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        const newUser = await pool.query(
            `INSERT INTO public.users (name, email, phone, alt_phone, address, password) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email`,
            [name, email.toLowerCase(), phone, alt_phone, address, hashedPassword]
        );

        // Send Welcome Email
        const mailOptions = {
            from: `"GoRepireo Team" <${EMAIL_USER}>`,
            to: email,
            subject: 'Welcome to GoRepireo',
            text: `Hi ${name},\n\nYour account has been successfully created.\n\nYou can now access our services.\n\nThank you for joining GoRepireo.`
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (mailError) {
            console.error('Email sending failed:', mailError);
        }

        res.status(201).json({ message: 'User registered successfully!', user: newUser.rows[0] });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// 2. Login User
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Find user
        const result = await pool.query('SELECT * FROM public.users WHERE email = $1', [email.toLowerCase()]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // Validate password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // Generate JWT
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            message: 'Logged in successfully',
            token,
            user: { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// 3. Request Password Reset OTP
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required.' });

        const result = await pool.query('SELECT id, name FROM public.users WHERE email = $1', [email.toLowerCase()]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ error: 'Email not found in our system.' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

        // Save OTP
        await pool.query(
            'UPDATE public.users SET reset_otp = $1, reset_otp_expires_at = $2 WHERE email = $3',
            [otp, expiresAt, email.toLowerCase()]
        );

        // Send Email
        const mailOptions = {
            from: `"GoRepireo Team" <${EMAIL_USER}>`,
            to: email,
            subject: 'Reset Your GoRepireo Password',
            text: `Hi ${user.name},\n\nYou requested to reset your password.\n\nYour One-Time Password (OTP) is:\n\n${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this change, please ignore this email.\n\nThank you,\nGoRepireo Team`
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'OTP sent to email.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// 4. Verify OTP
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        const result = await pool.query('SELECT reset_otp, reset_otp_expires_at FROM public.users WHERE email = $1', [email.toLowerCase()]);
        const user = result.rows[0];

        if (!user || !user.reset_otp) {
            return res.status(400).json({ error: 'Invalid request.' });
        }

        if (user.reset_otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP.' });
        }

        if (new Date() > new Date(user.reset_otp_expires_at)) {
            return res.status(400).json({ error: 'OTP has expired.' });
        }

        res.json({ message: 'OTP verified successfully.', token: jwt.sign({ resetEmail: email.toLowerCase() }, JWT_SECRET, { expiresIn: '15m' }) });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// 5. Reset Password
app.post('/api/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({ error: 'Token and new password required.' });
        }

        // Verify temp token
        const decoded = jwt.verify(resetToken, JWT_SECRET);
        if (!decoded.resetEmail) {
            return res.status(400).json({ error: 'Invalid token.' });
        }

        const email = decoded.resetEmail;

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update DB
        const result = await pool.query(
            'UPDATE public.users SET password = $1, reset_otp = NULL, reset_otp_expires_at = NULL WHERE email = $2 RETURNING name',
            [hashedPassword, email]
        );

        // Send confirmation email
        if (result.rows.length > 0) {
            const mailOptions = {
                from: `"GoRepireo Team" <${EMAIL_USER}>`,
                to: email,
                subject: 'Password Updated Successfully',
                text: `Hi ${result.rows[0].name},\n\nYour password has been successfully updated.\n\nIf this was not you, please contact support immediately.\n\nThank you,\nGoRepireo Team`
            };
            await transporter.sendMail(mailOptions);
        }

        res.json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Reset password error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ error: 'Reset session expired. Please start over.' });
        }
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// 6. Submit Application
app.post('/api/submit-application', async (req, res) => {
    try {
        const formData = req.body;

        // Insert into database
        // Changed to worker_applications per user request
        const result = await pool.query(
            `INSERT INTO public.worker_applications 
             (app_id, status_level, from_name, dob, gender, mobile, whatsapp, email, pincode, state, district, address, service, experience, tools, availability, login_access) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING id`,
            [formData.app_id, formData.status_level, formData.from_name, formData.dob, formData.gender, formData.mobile, formData.whatsapp, formData.email, formData.pincode, formData.state, formData.district, formData.address, formData.service, formData.experience, formData.tools, formData.availability, formData.login_access]
        );

        // Send submission email
        if (formData.email) {
            const mailOptions = {
                from: `"GoRepireo Team" <${EMAIL_USER}>`,
                to: formData.email,
                subject: 'Application Received Successfully',
                text: `Hi ${formData.from_name},\n\nYour application has been successfully submitted.\n\nOur team will review it and notify you once approved.\n\nThank you,\nGoRepireo Team`
            };
            try { await transporter.sendMail(mailOptions); } catch (e) { console.error('Email failed:', e); }
        }

        res.json({ message: 'Application submitted.' });
    } catch (error) {
        console.error('Submit app error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// 7. Approve Application
app.post('/api/approve-application', async (req, res) => {
    try {
        const { id, training_slot } = req.body;

        // Update
        // Check for unapproved applications in worker_applications
        const result = await pool.query(
            `UPDATE public.worker_applications 
             SET status_level = 6, login_access = true, training_slot = $1 
             WHERE id = $2 RETURNING email, from_name`,
            [training_slot, id]
        );

        if (result.rows.length > 0 && result.rows[0].email) {
            const mailOptions = {
                from: `"GoRepireo Team" <${EMAIL_USER}>`,
                to: result.rows[0].email,
                subject: 'Application Approved',
                text: `Hi ${result.rows[0].from_name},\n\nCongratulations!\n\nYour application has been approved by our admin team.\n\nYou may now proceed with your account access.\n\nWelcome to GoRepireo.`
            };
            try { await transporter.sendMail(mailOptions); } catch (e) { console.error('Email failed:', e); }
        }

        res.json({ message: 'Application approved.' });
    } catch (error) {
        console.error('Approve app error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// 8. Generic Send Email (Alternative to EmailJS)
app.post('/api/send-email', async (req, res) => {
    try {
        const { to, subject, text, html } = req.body;

        if (!to || !subject || (!text && !html)) {
            return res.status(400).json({ error: 'Missing email parameters.' });
        }

        const mailOptions = {
            from: `"GoRepireo Team" <${EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'Email sent successfully.' });
    } catch (error) {
        console.error('Email API error:', error);
        res.status(500).json({ error: 'Failed to send email.' });
    }
});

// ==========================================
// CATCH-ALL ROUTE
// ==========================================
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
