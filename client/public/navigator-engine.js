/**
 * NavigatorEngine.js
 * Advanced path tracing and high-accuracy GPS tracking for GoRepireo.
 * Implements "Penta" smoothing and sub-meter interpolation.
 */

class NavigatorEngine {
    constructor() {
        this.pentaBuffer = [];
        this.maxBufferSize = 5;
        this.currentBearing = 0;
        this.pathIndex = 0;
        this.segmentProgress = 0;
        this.moveStepMetres = 0.2;
        this.isRerouting = false;
        this.totalDistance = 0;
    }

    /**
     * "Penta" Smoothing: A 5-point moving average to eliminate GPS jitter.
     */
    smoothPosition(newCoords) {
        this.pentaBuffer.push(newCoords);
        if (this.pentaBuffer.length > this.maxBufferSize) {
            this.pentaBuffer.shift();
        }

        const sum = this.pentaBuffer.reduce((acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]], [0, 0]);
        return [sum[0] / this.pentaBuffer.length, sum[1] / this.pentaBuffer.length];
    }

    /**
     * High-Accuracy Heading Smoothing
     */
    smoothBearing(targetBearing, damping = 0.12) {
        let diff = (targetBearing - this.currentBearing + 180) % 360 - 180;
        this.currentBearing += diff * damping;
        return this.currentBearing;
    }

    /**
     * Sub-meter path interpolation logic.
     */
    calculateNextStep(currentPath) {
        if (!currentPath || currentPath.length < 2) return null;

        const p1 = L.latLng(currentPath[this.pathIndex]);
        const p2 = L.latLng(currentPath[this.pathIndex + 1]);
        const segmentDist = p1.distanceTo(p2);

        const stepProgress = this.moveStepMetres / (segmentDist || 1);
        this.segmentProgress += stepProgress;

        if (this.segmentProgress >= 1) {
            const extra = this.segmentProgress - 1;
            this.pathIndex++;
            
            if (this.pathIndex >= currentPath.length - 1) {
                return { arrived: true };
            }

            const nextP1 = L.latLng(currentPath[this.pathIndex]);
            const nextP2 = L.latLng(currentPath[this.pathIndex + 1]);
            const nextDist = nextP1.distanceTo(nextP2);
            this.segmentProgress = (extra * segmentDist) / (nextDist || 1);
        }

        const lat = p1.lat + (p2.lat - p1.lat) * this.segmentProgress;
        const lng = p1.lng + (p2.lng - p1.lng) * this.segmentProgress;

        return {
            latlng: [lat, lng],
            targetBearing: this.calculateBearing(currentPath[this.pathIndex], currentPath[this.pathIndex + 1]),
            arrivingData: this.getArrivingData(currentPath)
        };
    }

    getArrivingData(path) {
        let remainingDist = 0;
        // Remaining in current segment
        const p1 = L.latLng(path[this.pathIndex]);
        const p2 = L.latLng(path[this.pathIndex + 1]);
        remainingDist += p1.distanceTo(p2) * (1 - this.segmentProgress);

        for (let i = this.pathIndex + 1; i < path.length - 1; i++) {
            remainingDist += L.latLng(path[i]).distanceTo(L.latLng(path[i + 1]));
        }

        const seconds = remainingDist / 8.33;
        const minutes = Math.ceil(seconds / 60);
        return {
            minutes,
            distanceKm: (remainingDist / 1000).toFixed(1)
        };
    }

    calculateBearing(p1, p2) {
        const l1 = p1[0] * Math.PI / 180;
        const l2 = p2[0] * Math.PI / 180;
        const dl = (p2[1] - p1[1]) * Math.PI / 180;
        const y = Math.sin(dl) * Math.cos(l2);
        const x = Math.cos(l1) * Math.sin(l2) - Math.sin(l1) * Math.cos(l2) * Math.cos(dl);
        return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    }

    resetState() {
        this.pathIndex = 0;
        this.segmentProgress = 0;
    }
}

window.navigatorEngine = new NavigatorEngine();
