import { useState } from 'react'
import * as icons from "svg-by-dreamsoftware/icons-react-dist";
import './Regcont.css'

function Regcont() {


  return (
    <div className='Regcont'>
    <div className='Reg-box'>
        <div className='login-input'>
        <textarea placeholder='Введите логин...'></textarea>
        <textarea placeholder='Введите пароль...'></textarea>
        </div>
        <div className='login-btn'>
            <div>Войти</div>
        </div>
        <div className='login-reg'>
          <div>Регистрация</div>
        </div>
    </div>
    </div>

  )
}

export default Regcont;