import { useEffect, useRef, useState } from 'react'
import { parseBackup, serializeBackup, shiftDates, type GymBackup } from '../core/backup'
import { deleteWorkoutsAndRoutines, exportBackup, importBackup } from '../db/importer'
import type { Key } from '../i18n'
import { ACCENTS, db, useApp, useData, type Accent, type Appearance, type LangSetting } from '../state'
import { useDialogs } from '../ui/dialogs'
import { CheckIcon, ShareIcon } from '../ui/icons'
import { BarButton, Row, Screen, Section, Segmented } from '../ui/kit'
import { useSheet } from '../ui/nav'

const VERSION = '1.0'
const colorKey = (a: Accent) => `color${a[0].toUpperCase()}${a.slice(1)}` as Key

export function SettingsScreen() {
  const app = useApp()
  const { t, settings, update, isDark } = app
  const sheet = useSheet()
  const dialogs = useDialogs()
  const { workouts } = useData()
  const [taps, setTaps] = useState(0)
  const fileInput = useRef<HTMLInputElement>(null)
  const standalone = typeof matchMedia !== 'undefined' && (matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone)
  // undefined mientras se consulta o si el navegador no lo sabe decir: entonces no se muestra la fila.
  const [persisted, setPersisted] = useState<boolean>()
  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted, () => {})
  }, [])

  const tapVersion = () => {
    if (settings.developerMode) return
    if (taps + 1 >= 7) {
      update({ developerMode: true })
      setTaps(0)
    } else setTaps(taps + 1)
  }

  const runImport = async (backup: GymBackup, replace: boolean) => {
    try {
      const r = await importBackup(db, backup, app.lang, { replace })
      dialogs.alert(t('ready'), t('importDone', { w: r.workoutsImported, s: r.setsImported, e: r.exercisesCreated, r: r.routinesCreated }))
    } catch (error) {
      dialogs.alert(t('error'), String(error))
    }
  }
  /** Si ya hay entrenos, pregunta si reemplazar o añadir. */
  const askImport = (backup: GymBackup) => {
    if (!workouts.length) return void runImport(backup, false)
    dialogs.actions(t('alreadyHave', { n: workouts.length }), [
      { label: t('replaceMine'), destructive: true, onSelect: () => void runImport(backup, true) },
      { label: t('addToExisting'), onSelect: () => void runImport(backup, false) },
    ], t('importAsk', { n: backup.workouts.length }))
  }

  const loadSample = async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}sample-data.json`)
      askImport(shiftDates(parseBackup(await response.text()), new Date()))
    } catch (error) {
      dialogs.alert(t('fileInvalid'), String(error))
    }
  }

  const importFile = async (file: File) => {
    try {
      const backup = parseBackup(await file.text())
      if (!backup.workouts.length && !backup.routines.length && !backup.exercises.length) throw new Error(t('fileInvalid'))
      askImport(backup)
    } catch (error) {
      dialogs.alert(t('fileInvalid'), error instanceof Error ? error.message : String(error))
    }
  }

  const exportFile = async () => {
    const backup = await exportBackup(db)
    const name = `gym-${new Date().toISOString().slice(0, 10)}.json`
    const file = new File([serializeBackup(backup)], name, { type: 'application/json' })
    // En el iPhone abre la hoja de compartir (Guardar en Archivos, AirDrop…); si no se puede, descarga.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: name })
        return
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
      }
    }
    const url = URL.createObjectURL(file)
    const a = Object.assign(document.createElement('a'), { href: url, download: name })
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <Screen title={t('settings')} trailing={<BarButton bold onClick={sheet.dismiss}>{t('ok')}</BarButton>}>
      <div style={{ height: 16 }} />
      {!standalone && (
        <Section>
          <Row leading={<ShareIcon width={24} height={24} className="accent" />} title={<strong>{t('installTitle')}</strong>} subtitle={t('installBody')} />
        </Section>
      )}

      <Section header={t('appearance')} flush>
        <Segmented<Appearance>
          label={t('appearance')}
          value={settings.appearance}
          onChange={(appearance) => update({ appearance })}
          options={[
            { value: 'system', label: t('appearanceSystem') },
            { value: 'light', label: t('appearanceLight') },
            { value: 'dark', label: t('appearanceDark') },
          ]}
        />
      </Section>

      <Section header={t('accentColor')} footer={t('accentFooter')} flush>
        <div className="list swatches">
          {(Object.keys(ACCENTS) as Accent[]).map((accent) => {
            const color = ACCENTS[accent][isDark ? 1 : 0]
            const selected = settings.accent === accent
            return (
              <button key={accent} className="swatch" style={{ background: color, color }} aria-pressed={selected} aria-label={t(colorKey(accent))} onClick={() => update({ accent })}>
                {selected && <CheckIcon width={20} height={20} style={{ color: '#fff' }} />}
              </button>
            )
          })}
        </div>
      </Section>

      <Section header={t('language')} footer={t('languageFooter')} flush>
        <Segmented<LangSetting>
          label={t('language')}
          value={settings.lang}
          onChange={(lang) => update({ lang })}
          options={[
            { value: 'device', label: t('languageDevice') },
            { value: 'es', label: 'Castellano' },
            { value: 'ca', label: 'Català' },
          ]}
        />
      </Section>

      <Section header={t('data')} footer={persisted === false && !standalone ? t('storageFooterInstall') : t('dataFooter')}>
        {persisted !== undefined && <Row title={t('storage')} value={t(persisted ? 'storagePersistent' : 'storageEvictable')} />}
        <Row className="action" title={t('exportBackup')} onClick={exportFile} />
        <Row className="action" title={t('importFile')} onClick={() => fileInput.current?.click()} />
      </Section>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void importFile(file)
        }}
      />

      <Section>
        <Row title={t('version')} value={VERSION} onClick={tapVersion} />
      </Section>

      {settings.developerMode && (
        <Section header={t('developer')} footer={t('developerFooter', { n: workouts.length })}>
          <Row className="action" title={t('loadSample')} onClick={loadSample} />
          <Row
            className="destructive"
            title={t('deleteAll')}
            onClick={() => dialogs.confirm(t('deleteAllTitle'), t('delete'), async () => {
              await deleteWorkoutsAndRoutines(db)
              dialogs.alert(t('ready'), t('deletedAll'))
            }, t('deleteAllMessage'))}
          />
          <Row title={<span className="secondary">{t('hideDeveloper')}</span>} onClick={() => update({ developerMode: false })} />
        </Section>
      )}
    </Screen>
  )
}

