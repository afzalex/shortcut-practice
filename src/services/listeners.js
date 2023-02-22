
import {fromEvent} from "rxjs"
import {store, shortcutsSlice, setChallengeSuccessful} from '../store'
import {produce} from 'immer'

fromEvent(document, 'keyup', true)
    .subscribe(e => {
        if (e.keyCode === 91 || e.keyCode === 93) {
            store.dispatch(shortcutsSlice.actions.cmdInactive())
        }
    })

const isCmdActive = () => store.getState().shortcuts.isCmdPressed
const getChallenge = () => produce(store.getState().shortcuts.challenge, () => {})
const semiChallengeSuccessfulCounterSelector = () => store.getState().shortcuts.semiChallengeSuccessfulCounter

const validatorForCmdMetaKey = () => isCmdActive()
const validatorForOptionMetaKey = e => e.altKey
const validatorForShiftMetaKey = e => e.shiftKey
const validatorForCtrlMetaKey = e => e.ctrlKey
const validatorCreatorForCode = (k) => e => e.code === k
const shortcutKeyToEventCodeMap = {
    '/': 'Slash',
    '`': 'Backquote',
    '\'': 'Quote',
    '-': 'Minus',
    '.': 'Period',
    'Space': 'Space'
}
fromEvent(document, 'keydown', true)
  .subscribe(e => {
    if (e.keyCode === 91 || e.keyCode === 93) {
        store.dispatch(shortcutsSlice.actions.cmdActive())
        return
    }
    if (e.code === 'F12' && !(e.altKey || e.ctrlKey || e.shiftKey || isCmdActive())) {
        return
    }
    if (e.code === 'KeyR' && !(e.altKey || e.ctrlKey || e.shiftKey) && isCmdActive()) {
        return
    }
    if (e.key === 'Alt' || e.key === 'Control' || e.key === 'Shift') {
        return
    }
    const challenge = getChallenge()
    let keys = challenge.shortcutKeys.replaceAll('+ +', '+ Plus').split('+').map(a => a.trim())
    const metaValidators = []
    const getValidatorOrNegateValidatorAndReduceArrayIfFound = (array, item, action) => {
        const itemIndex = array.indexOf(item)
        if (itemIndex !== -1) {
            array.splice(itemIndex, 1)
            return action
        } else {
            return e => !action(e)
        }
    }
    metaValidators.push(getValidatorOrNegateValidatorAndReduceArrayIfFound(keys, 'Cmd', validatorForCmdMetaKey))
    metaValidators.push(getValidatorOrNegateValidatorAndReduceArrayIfFound(keys, 'Option', validatorForOptionMetaKey))
    metaValidators.push(getValidatorOrNegateValidatorAndReduceArrayIfFound(keys, 'Shift', validatorForShiftMetaKey))
    metaValidators.push(getValidatorOrNegateValidatorAndReduceArrayIfFound(keys, 'Ctrl', validatorForCtrlMetaKey))

    const semiChallengeSuccessfulCounter = semiChallengeSuccessfulCounterSelector()
    let currentChallengeKeyIndex = 0
    if(keys.length>1 && semiChallengeSuccessfulCounter > 0) {
        currentChallengeKeyIndex = semiChallengeSuccessfulCounter
    }
    let validators = keys.splice(currentChallengeKeyIndex, 1).map(k => {
        if(/^[a-zA-Z]$/.test(k)) {
            return validatorCreatorForCode('Key' + k.toUpperCase())
        } else if (/^[0-9]$/.test(k)) {
            return validatorCreatorForCode('Digit' + k)
        } else if (/^F[0-9]$/.test(k)) {
            return validatorCreatorForCode(k)
        } else if (k === 'Plus' || k === '=') {
            return e => e.code === 'Equal'
        } else if (k === 'Down' || k === 'Up' || k === 'Left' || k === 'Right') {
            return e => e.code === 'Arrow' + k
        } else if (k in shortcutKeyToEventCodeMap) {
            return e => e.code === shortcutKeyToEventCodeMap[k]
        } else if (k === '<letter>') {
            return e => /^Key[a-zA-Z]$/.test(e.code)
        } 
        return e => e.key === k
    })

    validators = validators.concat(metaValidators)
    
    if(validators.every(v => v(e))) {
        if(keys.length > 0 && semiChallengeSuccessfulCounter !== keys.length) {
            store.dispatch(shortcutsSlice.actions.setSemiChallengeSuccessful(semiChallengeSuccessfulCounter + 1))
        } else {
            // store.dispatch(shortcutsSlice.actions.setChallengeSuccessful(true))
            store.dispatch(setChallengeSuccessful())
            // store.dispatch(updateChallenge())
        }
    } else {
        if (semiChallengeSuccessfulCounter !== 0) {
            store.dispatch(shortcutsSlice.actions.setSemiChallengeSuccessful(0))
        }
        // store.dispatch(shortcutsSlice.actions.setChallengeFailed(true))
        store.dispatch(shortcutsSlice.actions.setChallengeSuccessState(2))
    }
    e.stopImmediatePropagation()
    e.stopPropagation()
    e.preventDefault()
  })
