# Gerenciador de Funcionários (simples)

Pequeno sistema front-end para gerenciar funcionários usando HTML, CSS e JavaScript (localStorage).

Funcionalidades:
- Cadastrar novo funcionário
- Editar um funcionário existente
- Excluir funcionário
- Listar e pesquisar
- Gerar relatório CSV usando Streams (ReadableStream)


## Como rodar localmente (sem Docker)

1. Abra o terminal (PowerShell ou Prompt de Comando) na pasta do projeto:
	`c:\Users\eduardo\Downloads\project\Ex4-Formulario-Funcionario`

2. Utilize o [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) no VS Code, ou Node.js com `npx serve`.

Como rodar em Docker:
1. Build: docker build -t funcionarios:local .
2. Run: docker run -p 8080:80 funcionarios:local
3. Abrir http://localhost:8080

Observações:
- Os dados ficam no localStorage do navegador.
- O relatório é gerado como CSV e baixado.
