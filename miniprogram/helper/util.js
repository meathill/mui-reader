import keyBy from '../libs/keyBy';

export const merge = function(from, to) {
  from = keyBy(from, 'id');
  to.forEach(item => {
    from[item.id] = item;
  });
  return Object.values(from);
};
