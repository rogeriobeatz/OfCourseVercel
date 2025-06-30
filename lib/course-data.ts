import type { Course, UserProgress } from "@/types/course"

// Simulação de dados - em produção viria de uma API/banco de dados
export const mockCourses: Course[] = [
  {
    id: "1",
    title: "JavaScript Moderno: Do Zero ao Profissional",
    description: "Aprenda JavaScript desde o básico até conceitos avançados com projetos práticos.",
    duration: "8 semanas",
    level: "iniciante",
    format: "misto",
    createdAt: new Date(),
    lessons: [
      {
        id: "1-1",
        title: "🚀 Fundamentos e Configuração do Ambiente",
        objective: "Entender os conceitos básicos do JavaScript e preparar o ambiente",
        content: `# Bem-vindo ao JavaScript!

JavaScript é uma das linguagens de programação mais populares do mundo. Criada em 1995, ela evoluiu de uma simples linguagem para adicionar interatividade às páginas web para uma linguagem completa que roda em servidores, aplicativos móveis e até mesmo em dispositivos IoT.

## Por que aprender JavaScript?

- **Versatilidade**: Uma linguagem, múltiplas plataformas
- **Mercado**: Alta demanda por desenvolvedores JavaScript
- **Comunidade**: Enorme comunidade e recursos disponíveis
- **Evolução**: Constantemente atualizada com novas funcionalidades

## Configurando seu ambiente

### 1. Editor de Código
Recomendamos o **Visual Studio Code** (VS Code):
- Gratuito e open source
- Extensões poderosas
- Debugging integrado
- Terminal integrado

### 2. Node.js
O Node.js permite executar JavaScript fora do navegador:
- Baixe em nodejs.org
- Instale a versão LTS (Long Term Support)
- Verifique a instalação: \`node --version\`

### 3. Extensões Úteis para VS Code
- **JavaScript (ES6) code snippets**
- **Prettier - Code formatter**
- **ESLint**
- **Live Server**

## Seu primeiro programa

\`\`\`javascript
console.log("Olá, mundo!");
\`\`\`

Parabéns! Você acabou de escrever seu primeiro programa em JavaScript.`,
        materials: "MDN Web Docs, VS Code, Node.js",
        practice: "Configure seu ambiente e crie um arquivo hello.js",
        duration: 45,
        order: 1,
        quiz: {
          id: "quiz-1-1",
          questions: [
            {
              id: "q1",
              question: "Em que ano o JavaScript foi criado?",
              options: ["1993", "1995", "1997", "1999"],
              correctAnswer: 1,
              explanation: "JavaScript foi criado em 1995 por Brendan Eich na Netscape.",
            },
            {
              id: "q2",
              question: "Qual comando verifica a versão do Node.js instalada?",
              options: ["node -v", "node --version", "npm version", "Ambas A e B"],
              correctAnswer: 3,
              explanation: 'Tanto "node -v" quanto "node --version" mostram a versão do Node.js.',
            },
          ],
        },
      },
      {
        id: "1-2",
        title: "📊 Variáveis, Tipos de Dados e Operadores",
        objective: "Dominar os tipos de dados fundamentais e como manipulá-los",
        content: `# Variáveis e Tipos de Dados

## Declarando Variáveis

Em JavaScript moderno, usamos principalmente \`let\` e \`const\`:

\`\`\`javascript
// const - valor não pode ser reatribuído
const nome = "João";
const idade = 25;

// let - valor pode ser alterado
let pontuacao = 0;
pontuacao = 100; // OK

// var - evite usar (escopo confuso)
var antiga = "não recomendado";
\`\`\`

## Tipos de Dados Primitivos

### 1. String (Texto)
\`\`\`javascript
const nome = "Maria";
const sobrenome = 'Silva';
const nomeCompleto = \`\${nome} \${sobrenome}\`; // Template literal
\`\`\`

### 2. Number (Números)
\`\`\`javascript
const inteiro = 42;
const decimal = 3.14;
const negativo = -10;
\`\`\`

### 3. Boolean (Verdadeiro/Falso)
\`\`\`javascript
const ativo = true;
const inativo = false;
\`\`\`

### 4. Undefined e Null
\`\`\`javascript
let indefinido; // undefined
const vazio = null; // null (ausência intencional de valor)
\`\`\`

## Operadores

### Aritméticos
\`\`\`javascript
const a = 10;
const b = 3;

console.log(a + b); // 13 (soma)
console.log(a - b); // 7 (subtração)
console.log(a * b); // 30 (multiplicação)
console.log(a / b); // 3.333... (divisão)
console.log(a % b); // 1 (resto da divisão)
\`\`\`

### Comparação
\`\`\`javascript
console.log(5 == "5");  // true (igualdade com conversão)
console.log(5 === "5"); // false (igualdade estrita)
console.log(5 != "5");  // false
console.log(5 !== "5"); // true
console.log(5 > 3);     // true
console.log(5 <= 5);    // true
\`\`\`

### Lógicos
\`\`\`javascript
const temIdade = true;
const temDocumento = false;

console.log(temIdade && temDocumento); // false (E)
console.log(temIdade || temDocumento); // true (OU)
console.log(!temIdade); // false (NÃO)
\`\`\``,
        materials: "JavaScript.info, Exercícios no Codewars",
        practice: "Crie variáveis para um perfil de usuário e pratique operações",
        duration: 60,
        order: 2,
        quiz: {
          id: "quiz-1-2",
          questions: [
            {
              id: "q1",
              question: "Qual a diferença entre == e === em JavaScript?",
              options: [
                "Não há diferença",
                "== compara valor, === compara valor e tipo",
                "=== é mais rápido",
                "== é mais moderno",
              ],
              correctAnswer: 1,
              explanation: "== faz conversão de tipo antes de comparar, === compara valor e tipo sem conversão.",
            },
          ],
        },
      },
    ],
  },
]

export const getUserProgress = (userId: string, courseId: string): UserProgress | null => {
  const saved = localStorage.getItem(`progress-${userId}-${courseId}`)
  return saved ? JSON.parse(saved) : null
}

export const saveUserProgress = (progress: UserProgress) => {
  localStorage.setItem(`progress-${progress.userId}-${progress.courseId}`, JSON.stringify(progress))
}
