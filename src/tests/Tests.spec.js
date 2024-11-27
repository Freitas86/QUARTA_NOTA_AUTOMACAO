import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// Métrica personalizada para rastrear o tempo de resposta das requisições GET.
export const getMoviesDuration = new Trend('get_movies', true);

// Configurações de thresholds.
export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // Menos de 1% de falhas nas requisições.
    http_req_duration: ['avg<5000'] // Duração média das requisições inferior a 5 segundos.
  }
};

// Função para gerar o resumo do teste ao final.
export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data), // Geração do relatório em HTML.
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

// Função principal que será executada a cada virtual user.
export default function () {
  const baseUrl = 'https://swapi.dev/api/';

  const params = {
    headers: {
      'Content-Type': 'application/json' // Cabeçalho Content-Type.
    }
  };

  const OK = 200; // Status HTTP esperado.

  // Realizando a requisição GET para obter a lista de filmes de Star Wars.
  const res = http.get(`${baseUrl}films/`, params);

  // Adicionando o tempo de resposta da requisição à métrica personalizada.
  getMoviesDuration.add(res.timings.duration);

  // Verificando o status da resposta e outras condições.
  check(res, {
    'Status é 200': () => res.status === OK,
    'Duração da requisição é abaixo de 5 segundos': () =>
      res.timings.duration < 5000,
    'Cabeçalho Content-Type é application/json': () =>
      res.headers['Content-Type'] === 'application/json; charset=utf-8'
  });

  // Simulando o "tempo de reflexão" entre as requisições, com base em uma variável de ambiente.
  sleep(1); // Pausa de 1 segundo entre as requisições (simulando comportamento real de usuário).
}
