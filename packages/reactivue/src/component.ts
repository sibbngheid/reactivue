/* eslint-disable import/no-mutable-exports */
import { Ref, ReactiveEffect, ref, stop } from '@vue/reactivity'
import { invokeLifeCycle } from './lifecycle'
import { InternalInstanceState, LifecycleHooks } from './types'

let _id = 0
const _vueState: Record<number, InternalInstanceState> = {}

export let currentInstance: InternalInstanceState | null = null
export let currentInstanceId: number | null = null

export const getNewInstanceId = () => _id++
export const getCurrentInstance = () => currentInstance
export const setCurrentInstance = (
  instance: InternalInstanceState | null,
) => {
  currentInstance = instance
}
export const setCurrentInstanceId = (id: number | null) => {
  currentInstanceId = id
  currentInstance = id != null ? (_vueState[id] || null) : null
  return currentInstance
}
export const createNewInstanceWithId = (id: number, props: any, data: Ref<any> = ref(null)) => {
  const instance: InternalInstanceState = {
    _id: id,
    props,
    data,
    isUnmounted: false,
    hooks: {},
  }
  _vueState[id] = instance
  return instance
}

export const useInstanceScope = (id: number, cb: (instance: InternalInstanceState | null) => void) => {
  const prev = currentInstanceId
  const instance = setCurrentInstanceId(id)
  cb(instance)
  setCurrentInstanceId(prev)
}

export const unmountInstance = (id: number) => {
  if (_vueState[id]) {
    invokeLifeCycle(LifecycleHooks.BEFORE_UNMOUNT, _vueState[id])
    // unregister all the computed/watch effects
    for (const effect of _vueState[id].effects || [])
      stop(effect)
    invokeLifeCycle(LifecycleHooks.UNMOUNTED, _vueState[id])
    _vueState[id].isUnmounted = true
  }

  // release the ref
  delete _vueState[id]
}

// record effects created during a component's setup() so that they can be
// stopped when the component unmounts
export function recordInstanceBoundEffect(effect: ReactiveEffect) {
  if (currentInstance)
    (currentInstance.effects || (currentInstance.effects = [])).push(effect)
}
