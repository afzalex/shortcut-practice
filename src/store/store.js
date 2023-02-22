
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
          'shortcut': shortcuts_dictionary[subjectName][v],
          'successCount': 0
        }))
      })
      .reduce((acc, curr) => [...acc, ...curr], [])
  ))
}
// resetShortcutsArray()


function getInitSubjectsAndResetShortcutsArray() {
  let subjects = Object.keys(shortcuts_dictionary).reduce((acc, curr) => ({...acc, [curr]: true}), {});
  let doResetLocalStorageShortcutsSubject = true
  if (localStorage.shortcutsSubjects) {
    try {
      let localStorageSubjects = JSON.parse(localStorage.shortcutsSubjects)
      for (let k in subjects) {
        if (k in localStorageSubjects) {
          subjects[k] = !!localStorageSubjects[k]
        }
      }
      doResetLocalStorageShortcutsSubject = false
    } catch (error) {
      console.log(error)
    }
  } 
  if (doResetLocalStorageShortcutsSubject) {
    localStorage.shortcutsSubjects = JSON.stringify(subjects)
  }
  resetShortcutsArray(subjects)
  return subjects
}

const shortcutsSlice = createSlice({
    name: 'shortcuts',
    initialState: {
      subjects: getInitSubjectsAndResetShortcutsArray(),
      isCmdPressed: false,
      challenge: getNewChallenge(),
      isLastChallengeSuccessful: false,
      semiChallengeSuccessfulCounter: 0
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
  localStorage.shortcutsSubjects = JSON.stringify(subjectSelections)
}

const setChallengeSuccessful = (isSuccessful) => dispatch => {
  if (isSuccessful && store.getState().shortcuts?.challenge) {
    const challengeShortcutIndex = store.getState().shortcuts?.challenge?.shortcutIndex;
    const challengeShortcutObject = shortcutsArray[challengeShortcutIndex]
    challengeShortcutObject.successCount++
  }
  dispatch(updateChallenge())
  dispatch(shortcutsSlice.actions.setChallengeSuccessful(isSuccessful))
}

function getNewChallenge() {
  if (!shortcutsArray || shortcutsArray.length === 0) {
    return {
      'subject': 'NA'
    }
  }
  
  // const shortcutObject = shortcutsArray[parseInt(Math.random() * shortcutsArray.length)]
  const shortcutIndex = getNewChallengeIndexBasedOnSuccess(shortcutsArray.map(a => a.successCount))
  const shortcutObject = shortcutsArray[shortcutIndex]
  return {
      'subject': shortcutObject.subject,
      'shortcutName': shortcutObject.name,
      'shortcutKeys': shortcutObject.shortcut,
      'shortcutIndex': shortcutIndex
  }
}

function getNewChallengeIndexBasedOnSuccess(successMatrix) {
  let successMatrixTemp = successMatrix.map(a => a + 1)
  const msum = successMatrixTemp.reduce((a, b) => a + b)
  successMatrixTemp = successMatrixTemp.map(a => msum - a)
  let tsum = 0
  const tTsum = successMatrixTemp.reduce((a, b) => a + b)
  const randomVal = parseInt(tTsum * Math.random())
  for (let i = 0; i < successMatrixTemp.length; i++) {
    tsum += successMatrixTemp[i]
    if (randomVal < tsum) {
      console.log(`With prob ${successMatrixTemp[i]}/${tTsum} (${parseFloat(successMatrixTemp[i]/tTsum).toFixed(2)}) for ${randomVal} between ${tsum - successMatrixTemp[i]} - ${tsum} selecting "${shortcutsArray[i].name}"`)
      return i
    }
  }
  return 0
}

updateChallenge()

export {store, shortcutsSlice, updateChallenge, setSubjectSelections, setChallengeSuccessful}
