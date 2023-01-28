import './App.css';
import { useEffect, useState } from "react";
import {useDispatch, useSelector} from 'react-redux'
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import {Drawer, FormGroup, FormControlLabel, Checkbox} from '@mui/material'
import {Box, Card, CardContent, CardActions, Button, IconButton, CardHeader, Snackbar, Alert} from '@mui/material'
import {produce} from 'immer'
import {updateChallenge, shortcutsSlice, setSubjectSelections} from '../store'

const selectChallenge = state => state.shortcuts.challenge
const selectLastChallengeSuccessful = state => state.shortcuts.isLastChallengeSuccessful
const selectSubjectSelections = state => produce(state.shortcuts.subjects, ()=>{})

function App() {
  
  const dispatch = useDispatch()
  const challenge = useSelector(selectChallenge)
  const isLastChallengeSuccessful = useSelector(selectLastChallengeSuccessful)
  const subjectSelections = useSelector(selectSubjectSelections)
  const [revealCurrentChallenge, setRevealCurrentChallenge] = useState(false)
  const [lastChallengeKeys, setLastChallengeKeys] = useState(undefined)
  const [subjectSelectionsTemporary, setSubjectSelectionsTemporary] = useState(subjectSelections)
  const [showDrawer, setShowDrawer] = useState(false)
  useEffect(() => {
    if(!isLastChallengeSuccessful) {
      setLastChallengeKeys(challenge.shortcutKeys)
    } else {
      setRevealCurrentChallenge(false)
    }
  }, [challenge, isLastChallengeSuccessful]);
  return (
    <Box flexGrow={1}>
      <AppBar position="static">
        <Toolbar>
          <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }} onClick={e => setShowDrawer(true)} >
              <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Shortcuts Training
          </Typography>
          <Button color="inherit" onClick={e => dispatch(updateChallenge())}>NEXT</Button>
        </Toolbar>
        <Drawer anchor='left' open={showDrawer} onClose={e => {
            setShowDrawer(false)
            dispatch(setSubjectSelections(subjectSelectionsTemporary))
          }} >
          <Box role="presentation" width={250} className='pl-3 mt-3'>
            <FormGroup>
              {Object.keys(subjectSelectionsTemporary).map(s => 
                <FormControlLabel key={s} control={
                  <Checkbox checked={subjectSelectionsTemporary[s]} onChange={e => {
                    return setSubjectSelectionsTemporary({...subjectSelectionsTemporary, [s]: !subjectSelectionsTemporary[s]})
                  }}/>
                } label={s} />)
              }
            </FormGroup>
          </Box>
        </Drawer>
      </AppBar>
      {challenge && <Box flexGrow={1} display="flex" justifyContent="center" alignItems="center" >
        <Box width={300} textAlign='center' className='pb-5 mt-5'>
          <Card sx={{ minWidth: 275 }} raised={true} >
            <CardHeader title={challenge.subject} className='bg-primary text-white'></CardHeader>
            <CardContent className='pt-5 pb-5 border-bottom' >
                {challenge.shortcutName}
            </CardContent>
            <CardActions>
              <Button size="small" onClick={e => setRevealCurrentChallenge(true)} >Reveal</Button>
            </CardActions>
          </Card>
        </Box>
      </Box>}
      <Snackbar open={isLastChallengeSuccessful} autoHideDuration={6000} onClose={e => dispatch(shortcutsSlice.actions.setChallengeSuccessful(false))}>
        <Alert severity="success" sx={{ width: '100%' }}>Shortcut Challenge Successful : {lastChallengeKeys}</Alert>
      </Snackbar>
      <Snackbar open={revealCurrentChallenge} autoHideDuration={6000} onClose={e => setRevealCurrentChallenge(false)}>
        <Alert severity="warning" sx={{ width: '100%' }}>Shortcut Challenge Correct Keys were : {challenge.shortcutKeys}</Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
