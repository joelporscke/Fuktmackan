/**
 * Saturation vapour pressure using the Magnus approximation.
 * @param {number} temperatureCelsius - Temperature in °C
 * @returns {number} Saturation vapour pressure in Pa
 */
export function saturationPressure(temperatureCelsius) {
  return 610.78 * Math.exp((17.27 * temperatureCelsius) / (temperatureCelsius + 237.3));
}

/**
 * Actual vapour pressure from temperature and relative humidity.
 * @param {number} temperatureCelsius - Temperature in °C
 * @param {number} relativeHumidity - Relative humidity as a fraction (0–1)
 * @returns {number} Vapour pressure in Pa
 */
export function vapourPressure(temperatureCelsius, relativeHumidity) {
  return saturationPressure(temperatureCelsius) * relativeHumidity;
}
