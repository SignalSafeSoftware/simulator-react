import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import { expect, it, vi } from 'vitest';
import MessagesNewThreadView from '../src/views/MessagesNewThreadView.js';
it('retains a rejected message and only navigates after the host accepts it',async()=>{
  const onSend=vi.fn().mockRejectedValueOnce(new Error('Try again')).mockResolvedValueOnce(undefined);
  const onBack=vi.fn();
  const view=create(createElement(MessagesNewThreadView,{onSend,onBack}));
  act(()=>view.root.findByType('input').props.onChange({target:{value:'+12025550123'}}));
  act(()=>view.root.findByType('textarea').props.onChange({target:{value:' Body stays exact '}}));
  await act(async()=>view.root.findByType('form').props.onSubmit({preventDefault(){}}));
  expect(view.root.findByProps({role:'alert'}).children).toEqual(['Try again']);
  expect(view.root.findByType('textarea').props.value).toBe(' Body stays exact ');
  expect(onBack).not.toHaveBeenCalled();
  await act(async()=>view.root.findByType('form').props.onSubmit({preventDefault(){}}));
  expect(onSend).toHaveBeenLastCalledWith({phoneNumber:'+12025550123',messageBody:' Body stays exact '});
  expect(onBack).toHaveBeenCalledOnce();
});
