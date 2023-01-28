
import { configureStore, createSlice } from '@reduxjs/toolkit'
import thunk from 'redux-thunk'

import shortcuts_dictionary from '../assets/shortcuts_dictionary';

const shortcutsArray = []
function resetShortcutsArray(selectedSubjects = (Object.keys(shortcuts_dictionary).reduce((a, c) => ({...a, [c]: true}), {}))) {
  shortcutsArray.splice(0, shortcutsArray.length)
  shortcutsArray.push(...(
    Object.keys(shortcuts_dictionary)
      .filter(s => selectedSubjects[s])
      .map(subjectName => {
        return Object.keys(shortcuts_dictionary[subjectName]).map(v => ({
          'subject': subjectName,
          'name': v,
          'shortcut': shortcuts_dictionary[subjectName][v]
        }))
      })
      .reduce((acc, curr) => [...acc, ...curr], [])
  ))
}
resetShortcutsArray()

const shortcutsSlice = createSlice({
    name: 'shortcuts',
    initialState: {
      subjects: Object.keys(shortcuts_dictionary).reduce((acc, curr) => ({...acc, [curr]: true}), {}),
      isCmdPressed: false,
      challenge: getNewChallenge(),
      isLastChallengeSuccessful: false,
      semiChallengeSuccessfulCounter: 0,
    }, 
    reducers: {
      toggleCmd: state => state.isCmdPressed = !state.isCmdPressed,
      cmdActive: state => ({...state, isCmdPressed: true}),
      cmdInactive: state => ({...state, isCmdPressed: false}),
      setNewChallenge: (state, action) => ({...state, challenge: action.payload}),
      setChallengeSuccessful: (state, action) => ({...state, semiChallengeSuccessfulCounter: 0, isLastChallengeSuccessful: action.payload}),
      setSemiChallengeSuccessful: (state, action) => ({...state, semiChallengeSuccessfulCounter: action.payload}),
      setSubjectSelections: (state, action) => ({...state, subjects: action.payload})
    }
  })

const logger = store => next => action => {
  // console.log('dispatching', action)
  let result = next(action)
  // console.log('next state', store.getState())
  return result
}

const store = configureStore({
  reducer: {
      shortcuts: shortcutsSlice.reducer
  }, 
  middleware: [logger, thunk]
})

const updateChallenge = () => dispatch => {
  
  dispatch(shortcutsSlice.actions.setNewChallenge(getNewChallenge()))
}
const setSubjectSelections = (newSubjectSelections) => dispatch => {
  const state = store.getState().shortcuts
  if(Object.keys(state.subjects).every(k => state.subjects[k] === newSubjectSelections[k])) {
    return
  }
  const subjectSelections = Object.keys(state.subjects).reduce((acc, curr) => ({...acc, [curr]: !!newSubjectSelections[curr]}), {})
  dispatch(shortcutsSlice.actions.setSubjectSelections(subjectSelections))
  resetShortcutsArray(subjectSelections)
  dispatch(updateChallenge())
}

function getNewChallenge() {
  if (!shortcutsArray || shortcutsArray.length === 0) {
    return {
      'subject': 'NA'
    }
  }
  const shortcutObject = shortcutsArray[parseInt(Math.random() * shortcutsArray.length)]
  return {
      'subject': shortcutObject.subject,
      'shortcutName': shortcutObject.name,
      'shortcutKeys': shortcutObject.shortcut
  }
}
updateChallenge()

export {store, shortcutsSlice, updateChallenge, setSubjectSelections}