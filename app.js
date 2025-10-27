

'use strict'

const STORAGE_KEY = 'employees_v1'

const uid = ()=> {
  let id = Date.now().toString(36) + Math.random().toString(36).slice(2,8)
  while(employees.find(x=>x.id===id)) id = Date.now().toString(36) + Math.random().toString(36).slice(2,8)
  return id
}

const load = ()=> {
  try { 
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') 
  } catch (e){ 
    return [] 
  }
}
const persist = (list)=> localStorage.setItem(STORAGE_KEY, JSON.stringify(list))

const fmtCurrency = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v))
const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('pt-BR') : ''

const form = document.getElementById('employee-form')
const tableBody = document.querySelector('#employees-table tbody')
const tpl = document.getElementById('row-template')
const search = document.getElementById('search')
const refresh = document.getElementById('refresh')
// Removido botão de limpar
const reportBtn = document.getElementById('report')
const msgEl = document.getElementById('msg')

function showMessage(text, type='info', timeout=2000){
  msgEl.textContent = text
  msgEl.style.display = 'block'
  msgEl.style.background = type==='success' ? '#e6f9ee' : type==='error' ? '#ffecec' : '#e8f0fe'
  msgEl.style.color = type==='success' ? '#0b4f2b' : type==='error' ? '#6a1b1b' : '#0b4270'
  setTimeout(()=>{ msgEl.style.display='none'; msgEl.textContent=''; }, timeout)
}

let employees = load()

function render(filter=''){
  tableBody.innerHTML = ''
  const q = (filter||'').toLowerCase().trim()
  employees.filter(e=> !q || e.name.toLowerCase().includes(q) || e.cpf.includes(q) || e.role.toLowerCase().includes(q))
    .forEach(e=>{
      const tr = tpl.content.cloneNode(true)
      tr.querySelector('.t-name').textContent = e.name
      tr.querySelector('.t-cpf').textContent = e.cpf
      tr.querySelector('.t-birth').textContent = fmtDate(e.birth)
      tr.querySelector('.t-role').textContent = e.role
      tr.querySelector('.t-salary').textContent = fmtCurrency(e.salary)
      tr.querySelector('.edit').addEventListener('click', ()=> startEdit(e.id))
      tr.querySelector('.delete').addEventListener('click', ()=> removeEmployee(e.id))
      tableBody.appendChild(tr)
    })
}

function resetForm(){ form.reset(); document.getElementById('employee-id').value = '' }

function startEdit(id){
  const e = employees.find(x=>x.id===id); if(!e) return
  document.getElementById('employee-id').value = e.id
  document.getElementById('name').value = e.name
  document.getElementById('cpf').value = e.cpf
  document.getElementById('birth').value = e.birth
  document.getElementById('role').value = e.role
  document.getElementById('salary').value = e.salary
}

function removeEmployee(id){
  if(!confirm('Confirma exclusão?')) return;
  employees = employees.filter(x=>x.id!==id);
  persist(employees);
  render('');
  showMessage('Funcionário excluído com sucesso!', 'success');
}

form.addEventListener('submit', ev=>{
  ev.preventDefault()
  const id = document.getElementById('employee-id').value
  const name = document.getElementById('name').value.trim()
  const cpf = document.getElementById('cpf').value.trim()
  const birth = document.getElementById('birth').value
  const role = document.getElementById('role').value.trim()
  const salary = Number(document.getElementById('salary').value || 0)
  if(!name || !cpf || !birth || !role){ showMessage('Preencha todos os campos obrigatórios', 'error'); return }
  if(cpf.length !== 11 || !/^[0-9]+$/.test(cpf)){ showMessage('CPF deve ter 11 dígitos numéricos', 'error'); return }
  if(id){
    const i = employees.findIndex(x=>x.id===id);
    if(i>-1) employees[i] = {...employees[i], name, cpf, birth, role, salary}
    else {
      showMessage('ID não encontrado para edição.', 'error');
      return;
    }
  } else {
    employees.push({id: uid(), name, cpf, birth, role, salary})
  }
  persist(employees)
  employees = load()
  resetForm()
  render('')
  showMessage('Funcionário salvo com sucesso!', 'success')
})

// Botão de limpar removido
search.addEventListener('input', e=> render(e.target.value))
if(refresh) refresh.addEventListener('click', ()=>{ employees = load(); render('') })

reportBtn.addEventListener('click', async ()=>{
  if(!employees.length){ alert('Nenhum funcionário cadastrado'); return }
  const fname = `relatorio-${new Date().toISOString().slice(0,10)}.csv`
  const stream = new ReadableStream({ start(ctrl){ ctrl.enqueue(new TextEncoder().encode('Nome;CPF;Data Nasc;Cargo;Salario\n')); employees.forEach(e=> ctrl.enqueue(new TextEncoder().encode(`${e.name};${e.cpf};${fmtDate(e.birth)};${e.role};${Number(e.salary).toFixed(2)}\n`)) ); ctrl.close() } })
  const blob = await new Response(stream).blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = fname; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
})

// initial render
render()

// debug helper
window.__employees = {get: ()=> employees, persist}
