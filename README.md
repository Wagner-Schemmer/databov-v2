# 🐄 DataBov v2 — Bem-Estar Animal Monitorado e Certificado, Direto da Coleira

[![Live](https://img.shields.io/badge/demo-ao_vivo-4ade80?style=for-the-badge&logo=vercel&logoColor=white)](https://databov-v2.vercel.app)
[![Dashboard](https://img.shields.io/badge/dashboard-tempo_real-22c55e?style=for-the-badge&logo=supabase&logoColor=white)](https://databov-v2.vercel.app/dashboard.html)
![HTML](https://img.shields.io/badge/HTML-5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JS](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat-square&logo=three.js&logoColor=white)

Landing premium + dashboard em tempo real + calculadora de ROI + captura de leads para o sistema DataBov: coleira inteligente com IA que transforma comportamento animal em **índice de bem-estar certificável de 1 a 5** (Compost Barn e Freestall).

> *O rebanho fala. o tempo todo. A gente escuta — 24h por coleira. E prova.*

![Preview](docs/preview.png)

## ✨ Destaques
- 📊 **Dashboard ao vivo** — nota de bem-estar (dial), ruminação, alertas, cio detectado e gráfico, tudo via Supabase Realtime (`leituras`)
- 🧮 **Calculadora de ROI** — sliders (rebanho, cio perdido, doença tardia) com retorno R$/ano
- 🐄 **Coleira 3D interativa** — Wemos D1 Mini + MPU6050 + MAX30102 em Three.js, com passo a passo
- 📝 **Captura de leads** — formulário → tabela `leads` + abertura de WhatsApp com mensagem pronta
- 🔍 **Busca de seções** no navbar glassy + menu mobile + botão WhatsApp flutuante

## 🗂️ Estrutura
```
databov-v2/
├── index.html          # landing (cine, hero, coleira 3D, solução, ROI, certificação, planos, demo, FAQ)
├── dashboard.html      # painel do produtor em tempo real
├── styles.css / app.js # identidade verde + interatividade
├── js/collar3d.js      # coleira 3D (three@0.160.0)
├── supabase-*.js/sql   # config + schema (depoimentos, leituras, leads, site_config)
└── api/health.js       # health check p/ monitoramento
```

## Rodar
`python3 -m http.server` na pasta.

## Banco
Rode `supabase-schema.sql` no SQL Editor do Supabase e preencha `supabase-config.js`.

## Deploy
[![Vercel](https://img.shields.io/badge/Vercel-deploy-black?style=flat-square&logo=vercel&logoColor=white)](https://databov-v2.vercel.app) `vercel deploy --prod --yes` (sem `--name`, para não duplicar o projeto).

## Hardware parceiro
Firmware da coleira (ESP8266 + MPU6050 + MAX30102 → Supabase) em [`rebanho-vivo-backend`](https://github.com/Wagner-Schemmer/rebanho-vivo-backend). Site v1 em [`monitoramento-animal-site`](https://github.com/Wagner-Schemmer/monitoramento-animal-site) ([databov.vercel.app](https://databov.vercel.app)).
