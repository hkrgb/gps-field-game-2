/**
 * GPS 工具：距離計算、定位、監聽
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
    getCurrentPosition,
    watchPosition,
    stopWatch
  };
})();
