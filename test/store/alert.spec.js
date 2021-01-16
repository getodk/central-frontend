import store from '../../src/store';

describe('store/modules/alert', () => {
  describe('mutations', () => {
    describe('setAlert', () => {
      it('sets the properties', () => {
        store.commit('setAlert', {
          type: 'info',
          message: 'Something happened!'
        });
        const { alert } = store.state;
        alert.type.should.equal('info');
        alert.message.should.equal('Something happened!');
        alert.state.should.be.true();
      });
    });

    describe('hideAlert', () => {
      it('sets state to false', () => {
        store.commit('setAlert', {
          type: 'info',
          message: 'Something happened!'
        });
        store.commit('hideAlert');
        store.state.alert.state.should.be.false();
      });
    });
  });
});
