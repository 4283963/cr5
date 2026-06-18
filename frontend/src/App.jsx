import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import MainLayout from './components/MainLayout'
import Dashboard from './pages/Dashboard'
import Machines from './pages/Machines'
import Channels from './pages/Channels'
import Tags from './pages/Tags'
import Orders from './pages/Orders'

const { Content } = Layout

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="machines" element={<Machines />} />
          <Route path="channels" element={<Channels />} />
          <Route path="tags" element={<Tags />} />
          <Route path="orders" element={<Orders />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
