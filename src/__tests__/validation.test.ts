import Validation from '../lib/validation';

describe('Validation tests', () => {
  test('Should create validation', () => {
    const validation = new Validation();
    expect(validation).toBeInstanceOf(Validation);
  });

  test('Should create validation with message', () => {
    const validation = new Validation('Invalid block', false);
    expect(validation.getMessage()).toBe('Invalid block');
    expect(validation.getStatus()).toBeFalsy();
  });
});
