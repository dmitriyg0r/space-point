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
        <div className='sidebar-content'>
        <div className='sidebar-search'>
          <icons.Search className='search-ico'/>
          <textarea placeholder='Поиск по галактике...'></textarea>
        </div>
        <div className='sidebar-button'>
            <icons.Profile className='sidebar-button-ico'/>
            <p>Профиль</p>
        </div>
        <div className='sidebar-button'>
            <icons.Chat className='sidebar-button-ico'/>
            <p>Сообщения</p>
        </div>
        <div className='sidebar-button'>
            <icons.Pencil className='sidebar-button-ico'/>
            <p>Закладки</p>
        </div>
        <div className='sidebar-button'>
            <icons.Update className='sidebar-button-ico'/>
            <p>Планеты</p>
        </div>
        <div className='sidebar-button'>
            <icons.Settings className='sidebar-button-ico'/>
            <p>Иследования</p>
        </div>
        <div className='sidebar-button'>
            <icons.Settings className='sidebar-button-ico'/>
            <p>Экипаж</p>
        </div>
        <div className='sidebar-button'>
            <icons.Settings className='sidebar-button-ico'/>
            <p>Станции</p>
        </div>
        <div className='sidebar-button'>
            <icons.Settings className='sidebar-button-ico'/>
            <p>Настройки</p>
        </div>
        <div className='sidebar-recomends'>
            <div className='sidebar-recomends-header'>
                <icons.Star className='star'/>
                <p>Популярные темы</p>
            </div>
            <div className='sidebar-recomends-posts'>
                    <h1>#Марсианская миссия</h1>
                    <p>1.2k постов</p>
                    <h1>#Звездные карты</h1>
                    <p>892 постов</p>
                    <h1>#Космические открытия</h1>
                    <p>645 постов</p>
                    <h1>#Орбитальные станции</h1>
                    <p>423 постов</p>
            </div>
            
        </div>
        <div className='sidebar-research'>
            <icons.Search className='sidebar-research-ico'/>
            <p>Иследовать</p>
        </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
