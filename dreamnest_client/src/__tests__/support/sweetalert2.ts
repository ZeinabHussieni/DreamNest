const confirmResult = { isConfirmed: true, isDenied: false, isDismissed: false };

export const fire = jest.fn(async () => confirmResult);

const SweetAlert2 = {
  fire,
};

export default SweetAlert2;


test('sweetalert2 mock loaded', () => expect(typeof fire).toBe('function'));


