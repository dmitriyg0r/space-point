import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css';
import App from './App.jsx'
import Chat from './Chat.jsx';
import Register from './Register.jsx';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<App />}/>
                <Route path='/Chat' element={<Chat />}/>
                <Route path='/Register' element={<Register />}/>
            </Routes>
        </BrowserRouter>
    </StrictMode>
)
