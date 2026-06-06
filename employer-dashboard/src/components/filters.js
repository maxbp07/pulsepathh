const DEPARTMENTS = [
  { value: '', label: 'Todos los departamentos' },
  { value: 'atencion_ciudadana', label: 'Atención ciudadana' },
  { value: 'informatica', label: 'Informática' },
];

const SHIFTS = [
  { value: '', label: 'Todos los turnos' },
  { value: 'morning', label: 'Mañana' },
  { value: 'afternoon', label: 'Tarde' },
];

function defaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

/** Icono SVG de filtro (inline, sin dependencias). */
const filterIcon = `
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>`;

/**
 * Renderiza los filtros: departamento, turno, rango de fechas y botón "Aplicar".
 * Los datos NO se cargan automáticamente al cambiar un campo; el usuario debe
 * confirmar explícitamente con el botón.
 *
 * @param {HTMLElement} container
 * @param {{ orgId?: string, onFilterChange?: (filters: object) => void }} options
 */
export function renderFilters(container, { onFilterChange } = {}) {
  const { from, to } = defaultDateRange();

  container.innerHTML = `
    <h2 class="card-title">${filterIcon} Filtros</h2>
    <form class="filters-bar" id="filters-form" novalidate>

      <div class="form-group">
        <label for="filter-department">Departamento</label>
        <select id="filter-department" name="department" aria-label="Filtrar por departamento">
          ${DEPARTMENTS.map((d) => `<option value="${d.value}">${d.label}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label for="filter-shift">Turno</label>
        <select id="filter-shift" name="shift" aria-label="Filtrar por turno">
          ${SHIFTS.map((s) => `<option value="${s.value}">${s.label}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label for="filter-from">Fecha desde</label>
        <input
          type="date"
          id="filter-from"
          name="from"
          value="${from}"
          max="${to}"
          aria-label="Fecha de inicio del rango"
        />
      </div>

      <div class="form-group">
        <label for="filter-to">Fecha hasta</label>
        <input
          type="date"
          id="filter-to"
          name="to"
          value="${to}"
          min="${from}"
          aria-label="Fecha de fin del rango"
        />
      </div>

      <div class="filters-apply">
        <button type="submit" class="btn btn-accent" id="filters-apply-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Aplicar filtros
        </button>
      </div>

    </form>
  `;

  const form = container.querySelector('#filters-form');
  const fromInput = form.querySelector('#filter-from');
  const toInput = form.querySelector('#filter-to');

  // Sincronizar atributos min/max entre los date pickers.
  fromInput.addEventListener('change', () => {
    toInput.min = fromInput.value;
  });
  toInput.addEventListener('change', () => {
    fromInput.max = toInput.value;
  });

  /** Recoge el estado actual del formulario y emite el cambio. */
  function emitChange() {
    const filters = {
      department: form.department.value || undefined,
      shift: form.shift.value || undefined,
      from: form.from.value || undefined,
      to: form.to.value || undefined,
    };
    onFilterChange?.(filters);
  }

  // El envío ocurre solo al hacer clic en "Aplicar filtros".
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    emitChange();
  });
}
