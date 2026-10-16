import { useState } from 'react'
import { CalendarScreen } from './screens/CalendarScreen'
import { ExerciseListScreen } from './screens/ExerciseScreens'
import { ProgressListScreen } from './screens/ProgressScreens'
import { RoutineListScreen } from './screens/RoutineScreens'
import { AppProvider, DataProvider, useApp } from './state'
import { DialogHost } from './ui/dialogs'
import { CalendarIcon, ChartIcon, DumbbellIcon, ListIcon } from './ui/icons'
import { SheetHost, Stack } from './ui/nav'

type Tab = 'calendar' | 'routines' | 'exercises' | 'progress'

export function App() {
  return (
    <AppProvider>
      <DataProvider>
        <DialogHost>
          <SheetHost>
            <Shell />
          </SheetHost>
        </DialogHost>
      </DataProvider>
    </AppProvider>
  )
}

function Shell() {
  const { t } = useApp()
  const [tab, setTab] = useState<Tab>('calendar')
  const tabs: { id: Tab; label: string; icon: JSX.Element; root: JSX.Element }[] = [
    { id: 'calendar', label: t('tabCalendar'), icon: <CalendarIcon />, root: <CalendarScreen /> },
    { id: 'routines', label: t('tabRoutines'), icon: <ListIcon />, root: <RoutineListScreen /> },
    { id: 'exercises', label: t('tabExercises'), icon: <DumbbellIcon />, root: <ExerciseListScreen /> },
    { id: 'progress', label: t('tabProgress'), icon: <ChartIcon />, root: <ProgressListScreen /> },
  ]
  return (
    <div className="app">
      <div className="tab-content">
        {/* Cada pestaña conserva su pila y su scroll al cambiar de pestaña. */}
        {tabs.map((item) => (
          <div key={item.id} style={{ position: 'absolute', inset: 0, display: item.id === tab ? undefined : 'none' }}>
            <Stack root={item.root} rootTitle={item.label} />
          </div>
        ))}
      </div>
      <nav className="tabbar" role="tablist">
        {tabs.map((item) => (
          <button key={item.id} className="tab" role="tab" aria-selected={item.id === tab} onClick={() => setTab(item.id)}>
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
