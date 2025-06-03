// Importa todos os tipos da biblioteca
import * as TsUtils from '@caioms/ts-utils';
import * as NextjsUtils from '@caioms/ts-utils/nextjs';

declare global {
  // Adiciona todos os tipos ao namespace global
  namespace NodeJS {
    interface Global extends TsUtils, NextjsUtils {}
  }
}

// Necessário para que o arquivo seja tratado como um módulo
export {};