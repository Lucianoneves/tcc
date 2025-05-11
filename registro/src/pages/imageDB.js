const DB_NAME = 'MyImageDB';
const DB_VERSION = 3; // Incrementado a versão
const STORE_NAME = 'images'; 

const openDB = () => {   // Criação do banco de dados e da storte de imagens
  // Verifica se o IndexedDB está disponível no navegador
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('ocorrenciaId', 'ocorrenciaId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};


export const saveImage = async (file, ocorrenciaId) => {
  // Verificações iniciais robustas
  if (!file) throw new Error('Nenhum arquivo fornecido');
  if (!(file instanceof Blob)) throw new Error('Tipo de arquivo inválido');
  if (file.size === 0) throw new Error('Arquivo vazio');
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const imageData = {
          id: `img-${ocorrenciaId}-${Date.now()}`,
          ocorrenciaId,
          url: e.target.result,
          name: file.name,
          type: file.type,
          size: file.size,
          timestamp: new Date()
        };
        
        const request = store.put(imageData);
        
        request.onsuccess = () => resolve(imageData);
        request.onerror = (event) => {
          console.error('Erro no request:', event.target.error);
          reject(event.target.error);
        };
        
        transaction.onerror = (event) => {
          console.error('Erro na transação:', event.target.error);
          reject(event.target.error);
        };
      } catch (dbError) {
        console.error('Erro no banco de dados:', dbError);
        reject(dbError);
      }
    };
    
    reader.onerror = (error) => {
      console.error('Erro ao ler arquivo:', error);
      reject(new Error('Falha ao ler o arquivo'));
    };
    
    reader.readAsDataURL(file);
  });
};

export const getImages = async (ocorrenciaId) => {
  const db = await openDB();
  
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('ocorrenciaId');
    const request = index.getAll(ocorrenciaId);

    request.onsuccess = () => {
      const images = request.result || [];
      // Garantimos que cada imagem tenha uma URL acessível
      resolve(images.map(img => ({
        ...img,
        imageData: img.url // Padronizando o nome da propriedade
      })));
    };
    request.onerror = () => resolve([]);
  });
};

export const deleteImage = async (imageId) => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(imageId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Sistema de armazenamento local das imagens   um banco de dados NoSQL embutido nos navegadores modernos ///