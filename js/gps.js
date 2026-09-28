/**
 * GPS 工具：距離計算、方位、定位、監聽
 */
window.GPS = (function () {
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function isWithinRadius(userCoords, loc, radiusMeters) {
    if (!userCoords || loc.lat == null || loc.lng == null) return false;
    const d = calculateDistance(userCoords.lat, userCoords.lng, loc.lat, loc.lng);
    return d <= (radiusMeters || 50);
  }

  /**
   * Bearing in degrees from point 1 → point 2 (0 = north, clockwise).
   */
  function bearingDegrees(lat1, lng1, lat2, lng2) {
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x =
      Math.cos(φ1) * Math.sin(φ2) -
      Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);
    return ((θ * 180) / Math.PI + 360) % 360;
  }

  /** Traditional Chinese 8-direction label for a bearing (degrees). */
  function compassLabel(degrees) {
    const d = ((Number(degrees) % 360) + 360) % 360;
    const labels = ["北", "東北", "東", "東南", "南", "西南", "西", "西北"];
    const idx = Math.round(d / 45) % 8;
    return labels[idx];
  }

  /** Format meters: "<1000" → "N 米", else "X.X 公里". */
  function formatDistance(meters) {
    const m = Number(meters);
    if (!isFinite(m) || m < 0) return "—";
    if (m < 1000) return Math.round(m) + " 米";
    return (m / 1000).toFixed(m < 10000 ? 1 : 0) + " 公里";
  }

  /**
   * @returns {Promise<{lat:number,lng:number,accuracy?:number}>}
   */
  function getCurrentPosition(options) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("瀏覽器不支援 GPS"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        (err) => reject(err),
        Object.assign(
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 },
          options || {}
        )
      );
    });
  }

  let watchId = null;

  function watchPosition(onUpdate, onError) {
    if (!navigator.geolocation) {
      if (onError) onError(new Error("不支援 GPS"));
      return null;
    }
    stopWatch();
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        onUpdate({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
      },
      onError,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
    );
    return watchId;
  }

  function stopWatch() {
    if (watchId != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  return {
    calculateDistance,
    isWithinRadius,
    bearingDegrees,
    compassLabel,
    formatDistance,
    getCurrentPosition,
    watchPosition,
    stopWatch
  };
})();
