import axios from 'axios';

const BASE_URL = 'https://brasil.cep.dev/v1';

export interface ConsultaCepResponse {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
}

export async function consultaCep(cep: string): Promise<ConsultaCepResponse> {
  const url = `${BASE_URL}/${cep}.json`;
  const response = await axios.get(url);
  return response.data;
}
