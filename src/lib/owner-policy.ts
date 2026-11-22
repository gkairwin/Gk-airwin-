export function ownsPrivateProfile(callerId: string, storedOwnerId: string | undefined) {
  return Boolean(callerId && storedOwnerId && callerId === storedOwnerId);
}