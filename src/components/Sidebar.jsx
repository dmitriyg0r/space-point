import { useState } from 'react'
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
        <div className='sidebar-search'>Поиск по галактике...</div>
      </div>
    </>
  )
}

export default Sidebar
