import { useState } from 'react'
import * as icons from "svg-by-dreamsoftware/icons-react-dist";
import './Sidebar.css'

function Sidebar() {


  return (
    <>
      <div className='sidebar'>
        <div className='sidebar-header'>
            <div className='sidebar-logo'>
                <img src="" alt="" />
            </div>
            <div className='sidebar-logotext'>
                <h1>Space-Point</h1>
                <p>Космическая сеть</p>
            </div>
        </div>
        <div className='sidebar-search'>
          <icons.Search className='search-ico'/>
          <textarea placeholder='Поиск по галактике...'></textarea>
        </div>
        <div className='sidebar-button'>
            <icons.Search className='sidebar-button-ico'/>
            <p>Главная</p>
        </div>
        <div className='sidebar-button'>
            <icons.Search className='sidebar-button-ico'/>
            <p>Главная</p>
        </div>
        <div className='sidebar-button'>
            <icons.Search className='sidebar-button-ico'/>
            <p>Главная</p>
        </div>
        <div className='sidebar-button'>
            <icons.Search className='sidebar-button-ico'/>
            <p>Главная</p>
        </div>
        <div className='sidebar-button'>
            <icons.Search className='sidebar-button-ico'/>
            <p>Главная</p>
        </div>
        <div className='sidebar-button'>
            <icons.Search className='sidebar-button-ico'/>
            <p>Главная</p>
        </div>
        <div className='sidebar-button'>
            <icons.Search className='sidebar-button-ico'/>
            <p>Главная</p>
        </div>
        <div className='sidebar-button'>
            <icons.Search className='sidebar-button-ico'/>
            <p>Главная</p>
        </div>
      </div>
    </>
  )
}

export default Sidebar
