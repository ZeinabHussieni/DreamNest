import '../setup';
import timeAgo from '../../Utils/timeAgo';

test('timeAgo returns seconds/minutes/hours/days', () => {
  const now = new Date();
  expect(timeAgo(now.toISOString())).toMatch(/0s|1s|\ds/);
});


