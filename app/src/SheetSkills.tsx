import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Workbook } from './sheetModel'
import type { Reader, RuleSettings } from './companionRules'
import { SKILLS } from './companionRules'
import { skillCue } from './skillFormatting'
import { SkillSummary } from './CompanionPanels'
import SkillLibrary from './SkillLibrary'
export default function SheetSkills({
  book,
  read,
  settings,
  onSettings,
  field,
  legend,
}: {
  book: Workbook
  read: Reader
  settings: RuleSettings
  onSettings: () => void
  field: (name: string, row: number) => ReactNode
  legend: ReactNode
}) {
  const [search, setSearch] = useState(''),
    [filter, setFilter] = useState('All skills'),
    [libraryOpen, setLibraryOpen] = useState(false)
  const skills = SKILLS.map((name, i) => ({
    name,
    row: 25 + i,
    rank: read('v2.1', 'H' + (25 + i)),
    cue: skillCue(book, 'H' + (25 + i)),
  })).filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === 'All skills' ||
        (filter === 'Trained' &&
          (s.rank === 1 ||
            s.rank === true ||
            s.rank === '1' ||
            String(s.rank).toLowerCase() === 'e')) ||
        (filter === 'Expertise' && String(s.rank).toLowerCase() === 'e') ||
        (filter === 'Sheet choices' && s.cue.underline)),
  )
  const split = Math.ceil(skills.length / 2)
  const columns = [skills.slice(0, split), skills.slice(split)].filter((column) => column.length)
  return (
    <div className="skills-manager">
      <SkillSummary book={book} read={read} settings={settings} onSettings={onSettings} />
      <div className="skills-toolbar">
        <label className="field">
          <span>Find a skill</span>
          <input
            aria-label="Find a skill"
            placeholder="Search skills…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Show</span>
          <select
            aria-label="Show skills"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {['All skills', 'Trained', 'Expertise', 'Sheet choices'].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
        {legend}
        <button onClick={() => setLibraryOpen(true)}>Skill definitions</button>
      </div>
      <div className="skills-columns">
        {columns.map((column, i) => (
          <div className="skills-column" key={i}>
            <div className="skills-column-heading" aria-hidden="true">
              <span>Bonus</span>
              <span>Skill</span>
              <span>Training</span>
              <span />
            </div>
            <ul className="skills-list" aria-label={`Skill training ${i + 1}`}>
              {column.map((s) => field(s.name, s.row))}
            </ul>
          </div>
        ))}
      </div>
      {!skills.length && <p className="empty-state">No matching skills.</p>}
      {libraryOpen && <SkillLibrary onClose={() => setLibraryOpen(false)} />}
    </div>
  )
}
