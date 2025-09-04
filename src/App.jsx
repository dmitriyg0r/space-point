import { useState } from 'react'
import '@fontsource/jura';
import './App.css'
import Sidebar from './components/Sidebar'
import UserProfile from './components/UserProfile';
import { Profile } from 'svg-by-dreamsoftware';

function App() {


  return (
    <>
    <div>
      <Sidebar />
      <UserProfile />
    </div>
    </>
  )
}

export default App
