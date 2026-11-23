/**
 * Shared Protection PIN Validation Policy
 *
 * Enforces:
 * 1. Exactly 6 alphanumeric characters.
 * 2. Requires both letters and numbers.
 * 3. Prohibits using user's login PIN or password.
 * 4. Prohibits sequential numbers or letter series (e.g., 1234, 6543, abcd).
 * 5. Prohibits example numbers shown previously (e.g., 12569c, aserc2).
 * 6. Prohibits repetitive patterns (e.g., 111111, aaaaaa, 121212).
 * 7. Error messages NEVER display any concrete example number to prevent imitation.
 */

export function validateProtectionPin(
  pin: string,
  userLoginPinOrPass?: string,
  userEmpId?: string
): { valid: boolean; error?: string } {
  const cleanPin = String(pin || '').trim();

  // 1. Length check: Exactly 6 characters
  if (cleanPin.length !== 6) {
    return {
      valid: false,
      error: 'Protection PIN must be exactly 6 characters.',
    };
  }

  // 2. Must contain both letters and numbers
  const hasLetter = /[a-zA-Z]/.test(cleanPin);
  const hasNumber = /[0-9]/.test(cleanPin);
  if (!hasLetter || !hasNumber) {
    return {
      valid: false,
      error: 'Protection PIN must contain both letters and numbers.',
    };
  }

  const lower = cleanPin.toLowerCase();

  // 3. User Login PIN / Password / Employee ID check
  if (userLoginPinOrPass && lower === userLoginPinOrPass.toLowerCase().trim()) {
    return {
      valid: false,
      error: 'For security, you cannot use your login credentials as a file protection PIN.',
    };
  }
  if (userEmpId && lower === userEmpId.toLowerCase().trim()) {
    return {
      valid: false,
      error: 'You cannot use your Employee ID as a file protection PIN.',
    };
  }

  // Also check stored session employee ID if in localStorage
  try {
    const storedEmp = localStorage.getItem('vault_emp_id');
    if (storedEmp && lower === storedEmp.toLowerCase().trim()) {
      return {
        valid: false,
        error: 'You cannot use your Employee ID as a file protection PIN.',
      };
    }
  } catch {}

  // 4. Forbidden known campus credentials / seed PINs
  const forbiddenKnown = ['294280', '12569c', '123456', 'meera@123', 'test@134'];
  if (forbiddenKnown.includes(lower)) {
    return {
      valid: false,
      error: 'This PIN matches a campus login credential or default PIN and cannot be used.',
    };
  }

  // 5. Forbidden example numbers (e.g. 12569c, aserc2, etc.)
  const forbiddenExamples = [
    '12569c',
    'aserc2',
    'abcdef',
    '123456',
    '654321',
    '012345',
    '543210',
    'qwerty',
    'admin1',
    'secret'
  ];
  if (forbiddenExamples.includes(lower)) {
    return {
      valid: false,
      error: 'This example PIN cannot be used. Please create your own unique combination.',
    };
  }

  // 6. Repetitive patterns (4+ same characters, or repeating pairs)
  if (/^(.)\1{3,}/.test(lower) || /^(..)\1{2}$/.test(lower)) {
    return {
      valid: false,
      error: 'Protection PIN cannot contain repetitive character patterns. Choose a more varied combination.',
    };
  }

  // 7. Sequential number or letter series (3+ consecutive characters)
  const seriesPatterns = [
    '012', '123', '234', '345', '456', '567', '678', '789', '890',
    '987', '876', '765', '654', '543', '432', '321', '210',
    'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij',
    'cba', 'dcb', 'edc', 'fed', 'gfe', 'hgf', 'ihg'
  ];
  for (const seq of seriesPatterns) {
    if (lower.includes(seq)) {
      return {
        valid: false,
        error: 'Protection PIN cannot contain sequential number or letter series. Choose a unique combination.',
      };
    }
  }

  return { valid: true };
}
