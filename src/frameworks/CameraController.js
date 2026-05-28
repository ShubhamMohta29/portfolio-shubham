// Converts spherical coordinates (theta, phi, r) to a Cartesian camera position.

export const CAM_R    = 185;
export const BASE_PHI = 1.18;

export function positionCamera(camera, theta, phi, r = CAM_R) {
  camera.position.set(
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.cos(theta),
  );
  camera.lookAt(0, 0, 0);
}
