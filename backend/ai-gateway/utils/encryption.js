// Bug 26 Fix: Eliminate duplicated encryption logic.
// Forward all calls to the unified core utility.
export { encrypt, decrypt } from '../../utils/encryption.js';
