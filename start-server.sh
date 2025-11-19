#!/bin/bash
cd /Users/guilherme.monte/Documents/pawdoctor/purple-paw-finder
echo "Iniciando servidor na porta 8080..."
bun run dev &
echo "Servidor iniciado em background. PID: $!"
echo "Acesse: http://localhost:8080"