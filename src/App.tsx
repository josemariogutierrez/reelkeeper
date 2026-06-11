import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Inbox from './routes/Inbox'
import AddReel from './routes/AddReel'
import Lists from './routes/Lists'
import ListView from './routes/ListView'
import ReelDetail from './routes/ReelDetail'
import Settings from './routes/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Inbox />} />
        <Route path="/lists" element={<Lists />} />
        <Route path="/list/:id" element={<ListView />} />
        <Route path="/reel/:id" element={<ReelDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      {/* capture handler is outside the chrome so it can render full-screen */}
      <Route path="/add" element={<AddReel />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
