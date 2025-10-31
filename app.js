'use strict'

const STORAGE_KEY = 'funcionarios_v1'

class Funcionario {
  constructor(id, nome, idade, cargo, salario) {
    this._id = id
    this._nome = nome
    this._idade = Number(idade)
    this._cargo = cargo
    this._salario = Number(salario)
  }
  get id() { return this._id }
  get nome() { return this._nome }
  get idade() { return this._idade }
  get cargo() { return this._cargo }
  get salario() { return this._salario }
  set nome(v) { this._nome = v }
  set idade(v) { this._idade = Number(v) }
  set cargo(v) { this._cargo = v }
  set salario(v) { this._salario = Number(v) }
}

const generateId = list => {
  let id
  do {
    id = Date.now().toString(36) + Math.random().toString(36).slice(2,8)
  } while (list.some(x => x.id === id))
  return id
}

const load = () => {
  try {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return arr.map(o => new Funcionario(o._id, o._nome, o._idade, o._cargo, o._salario))
  } catch { return [] }
}

const persist = list => {
  const plain = list.map(f => ({ _id: f.id, _nome: f.nome, _idade: f.idade, _cargo: f.cargo, _salario: f.salario }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plain))
}

const fmtCurrency = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))

const form = document.getElementById('employee-form')
const tableBody = document.querySelector('#employees-table tbody')
const tpl = document.getElementById('row-template')
const search = document.getElementById('search')
const refresh = document.getElementById('refresh')
const reportBtn = document.getElementById('report')
const reportSummaryBtn = document.getElementById('report-summary')
const msgEl = document.getElementById('msg')

const showMessage = (text, type = 'info', timeout = 2000) => {
  if (!msgEl) return
  msgEl.textContent = text
  msgEl.className = `message ${type}`
  msgEl.style.display = 'block'
  setTimeout(() => { msgEl.style.display = 'none'; msgEl.textContent = ''; msgEl.className = 'message' }, timeout)
}

let funcionarios = load()

const render = (filter = '') => {
  if (!tableBody || !tpl) return
  tableBody.innerHTML = ''
  const q = (filter || '').toLowerCase().trim()
  funcionarios
    .filter(f => !q || f.nome.toLowerCase().includes(q) || f.cargo.toLowerCase().includes(q))
    .forEach(f => {
      const tr = tpl.content.cloneNode(true)
      tr.querySelector('.t-name').textContent = f.nome
      tr.querySelector('.t-age').textContent = f.idade
      tr.querySelector('.t-role').textContent = f.cargo
      tr.querySelector('.t-salary').textContent = fmtCurrency(f.salario)
      tr.querySelector('.edit').addEventListener('click', () => startEdit(f.id))
      tr.querySelector('.delete').addEventListener('click', () => removeFuncionario(f.id))
      tableBody.appendChild(tr)
    })
}

const resetForm = () => {
  if (form) form.reset()
  const idEl = document.getElementById('employee-id')
  if (idEl) idEl.value = ''
}

const startEdit = id => {
  const f = funcionarios.find(x => x.id === id)
  if (!f) return
  document.getElementById('employee-id').value = f.id
  document.getElementById('name').value = f.nome
  document.getElementById('age').value = f.idade
  document.getElementById('role').value = f.cargo
  document.getElementById('salary').value = f.salario
}

const removeFuncionario = id => {
  if (!confirm('Confirma exclusão?')) return
  funcionarios = funcionarios.filter(x => x.id !== id)
  persist(funcionarios)
  render('')
  showMessage('Funcionário excluído com sucesso!', 'success')
}

if (form) form.addEventListener('submit', ev => {
  ev.preventDefault()
  const id = document.getElementById('employee-id').value
  const nome = document.getElementById('name').value.trim()
  const idade = Number(document.getElementById('age').value)
  const cargo = document.getElementById('role').value.trim()
  const salario = Number(document.getElementById('salary').value || 0)
  if (!nome || Number.isNaN(idade) || !cargo) { showMessage('Preencha todos os campos obrigatórios', 'error'); return }
  if (idade < 0) { showMessage('Idade inválida', 'error'); return }
  if (salario < 0) { showMessage('Salário inválido', 'error'); return }

  if (id) {
    const i = funcionarios.findIndex(x => x.id === id)
    if (i > -1) {
      funcionarios[i].nome = nome
      funcionarios[i].idade = idade
      funcionarios[i].cargo = cargo
      funcionarios[i].salario = salario
      showMessage('Funcionário editado com sucesso!', 'success')
    } else { showMessage('Funcionário não encontrado para edição.', 'error'); return }
  } else {
    const newId = generateId(funcionarios)
    const novo = new Funcionario(newId, nome, idade, cargo, salario)
    funcionarios.push(novo)
    showMessage('Funcionário cadastrado com sucesso!', 'success')
  }
  persist(funcionarios)
  resetForm()
  render('')
})

if (search) search.addEventListener('input', e => render(e.target.value))
if (refresh) refresh.addEventListener('click', () => { funcionarios = load(); render('') })

if (reportBtn) reportBtn.addEventListener('click', async () => {
  if (!funcionarios.length) { alert('Nenhum funcionário cadastrado'); return }
  const fname = `relatorio-${new Date().toISOString().slice(0,10)}.csv`
  const stream = new ReadableStream({
    start: ctrl => {
      ctrl.enqueue(new TextEncoder().encode('Nome;Idade;Cargo;Salario\n'))
      funcionarios.forEach(f => ctrl.enqueue(new TextEncoder().encode(`${f.nome};${f.idade};${f.cargo};${Number(f.salario).toFixed(2)}\n`)))
      ctrl.close()
    }
  })
  const blob = await new Response(stream).blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fname
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
})

if (reportSummaryBtn) reportSummaryBtn.addEventListener('click', () => {
  const altos = funcionarios.filter(f => f.salario > 5000)
  const media = funcionarios.length ? funcionarios.reduce((acc, f) => acc + f.salario, 0) / funcionarios.length : 0
  const cargosUnicos = [...new Set(funcionarios.map(f => f.cargo))]
  const nomesMaiusculo = funcionarios.map(f => f.nome.toUpperCase())
  const lines = []
  lines.push(`Funcionários com salário > R$ 5000 (${altos.length}):`)
  lines.push(altos.map(a => ` - ${a.nome} (${a.cargo}) R$ ${Number(a.salario).toFixed(2)}`).join('\n') || ' - nenhum')
  lines.push('')
  lines.push(`Média salarial: R$ ${media.toFixed(2)}`)
  lines.push('')
  lines.push(`Cargos únicos (${cargosUnicos.length}): ${cargosUnicos.join(', ') || 'nenhum'}`)
  lines.push('')
  lines.push(`Nomes em MAIÚSCULO (${nomesMaiusculo.length}):`)
  lines.push(nomesMaiusculo.join(', '))
  alert(lines.join('\n'))
})

render()

window.__funcionarios = { get: () => funcionarios, persist }
