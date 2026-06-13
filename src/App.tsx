import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './data/auth'
import { DataProvider } from './data/store'
import SignIn from './components/SignIn'
import Layout from './components/Layout'
import Inbox from './routes/Inbox'
import AddReel from './routes/AddReel'
import Lists from './routes/Lists'
import ListView from './routes/ListView'
import ReelDetail from './routes/ReelDetail'
import Settings from './routes/Settings'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="splash">
        <div className="signin__logo" aria-hidden>
          ▶
        </div>
      </div>
    )
  }

  if (!user) return <SignIn />

  return (
    <DataProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Inbox />} />
          <Route path="/lists" element={<Lists />} />
          <Route path="/list/:id" element={<ListView />} />
          <Route path="/reel/:id" element={<ReelDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/add" element={<AddReel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DataProvider>
  )
}
