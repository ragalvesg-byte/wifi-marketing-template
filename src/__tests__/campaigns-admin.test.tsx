import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { CampaignsManager } from '../components/admin/campaigns-manager';

// Mock Supabase client
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

const mockSupabase = {
  storage: {
    from: vi.fn().mockImplementation(() => ({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    })),
  },
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

// Mock window.fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Lucide Icons to prevent render warnings/errors in JSDOM
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react') as any;
  return {
    ...actual,
    Megaphone: () => React.createElement('div', { 'data-testid': 'megaphone-icon' }),
    Tag: () => React.createElement('div', { 'data-testid': 'tag-icon' }),
    Users: () => React.createElement('div', { 'data-testid': 'users-icon' }),
    Trash2: () => React.createElement('div', { 'data-testid': 'trash-icon' }),
    Plus: () => React.createElement('div', { 'data-testid': 'plus-icon' }),
    Loader2: () => React.createElement('div', { 'data-testid': 'loader-icon' }),
    AlertCircle: () => React.createElement('div', { 'data-testid': 'alert-icon' }),
    CheckCircle: () => React.createElement('div', { 'data-testid': 'check-icon' }),
    Image: () => React.createElement('div', { 'data-testid': 'image-icon' }),
    Calendar: () => React.createElement('div', { 'data-testid': 'calendar-icon' }),
  };
});

describe('CampaignsManager Admin Form & Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockUpload.mockReset();
    mockGetPublicUrl.mockReset();
    mockFetch.mockReset();

    // Mock initial fetch campaigns (returns empty list)
    mockFetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ campaigns: [] }),
      })
    );
  });

  it('deve renderizar a listagem de campanhas vazia por padrão', async () => {
    render(<CampaignsManager />);
    await waitFor(() => {
      expect(screen.getByText('Nenhuma campanha cadastrada')).toBeInTheDocument();
    });
  });

  it('gênero não deve aparecer no formulário de criação/edição e apenas segmentações permitidas devem estar disponíveis', async () => {
    render(<CampaignsManager />);
    
    // Alterna para guia Criar Campanha
    const createTabButton = screen.getByText('Criar Campanha');
    fireEvent.click(createTabButton);

    // O dropdown de segmentação deve ter apenas as opções permitidas
    const selectTarget = screen.getByLabelText(/Critério de Segmentação \*/i);
    expect(selectTarget).toBeInTheDocument();

    const options = Array.from(selectTarget.querySelectorAll('option')).map(o => o.value);
    expect(options).toContain('ALL');
    expect(options).toContain('NEW_VISITORS');
    expect(options).toContain('RETURNING_VISITORS');
    expect(options).toContain('BIRTHDAY_MONTH');
    
    // GENDER não deve ser uma opção padrão disponível
    expect(options).not.toContain('GENDER');
  });

  it('deve exibir aviso de segmentação antiga não suportada e exigir nova segmentação se campanha antiga com GENDER for editada', async () => {
    const mockOldCampaign = {
      id: 'old-campaign-123',
      title: 'Campanha Antiga Gênero',
      description: 'Teste',
      type: 'PROMO',
      status: 'ACTIVE',
      campaign_audiences: [{ target_type: 'GENDER', rules: { gender: 'Feminino' } }],
    };

    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ campaigns: [mockOldCampaign] }),
      })
    );

    render(<CampaignsManager />);

    // Espera a listagem carregar a campanha antiga
    await waitFor(() => {
      expect(screen.getByText('Segmentação antiga não suportada')).toBeInTheDocument();
    });

    // Clica para editar
    const editButton = screen.getByTitle('Editar campanha');
    fireEvent.click(editButton);

    // Deve exibir o aviso no formulário de edição
    expect(screen.getByText(/Segmentação antiga não suportada\./i)).toBeInTheDocument();

    // Tenta salvar sem mudar a segmentação - deve exibir erro
    const submitButton = screen.getByText('Salvar e Publicar');
    fireEvent.click(submitButton);

    expect(screen.getByText('Segmentação antiga não suportada. Por favor, escolha um critério de segmentação ativo.')).toBeInTheDocument();
  });

  it('deve alternar corretamente o formulário de mídia entre Imagem e Vídeo e validar link de vídeo', async () => {
    render(<CampaignsManager />);
    
    fireEvent.click(screen.getByText('Criar Campanha'));

    // Por padrão, Imagem está selecionada, deve mostrar botão de Upload
    expect(screen.getByText('Clique para fazer upload')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('https://exemplo.com/video.mp4')).not.toBeInTheDocument();

    // Muda tipo de mídia para Vídeo
    const mediaSelect = screen.getByLabelText(/Tipo de Mídia \*/i);
    fireEvent.change(mediaSelect, { target: { value: 'VIDEO' } });

    // Deve esconder uploader e mostrar campo de texto do link de vídeo
    expect(screen.queryByText('Clique para fazer upload')).not.toBeInTheDocument();
    const videoInput = screen.getByPlaceholderText('https://exemplo.com/video.mp4');
    expect(videoInput).toBeInTheDocument();

    // Tenta submeter com URL de vídeo inválida (sem https://)
    fireEvent.change(videoInput, { target: { value: 'http://youtube.com/myvideo' } });
    
    // Preenche título obrigatório e código do cupom obrigatório para submissão
    fireEvent.change(screen.getByPlaceholderText(/Ex: Ganhe uma sobremesa hoje!/i), { target: { value: 'Vídeo Campanha' } });
    fireEvent.change(screen.getByPlaceholderText(/Ex: BEMVINDO10/i), { target: { value: 'VIDEO10' } });

    fireEvent.click(screen.getByText('Salvar e Publicar'));

    // Deve exibir o erro de validação do vídeo
    expect(screen.getByText('O link do vídeo deve iniciar com https://.')).toBeInTheDocument();
  });

  it('deve realizar upload de imagem com sucesso e preencher media_url', async () => {
    mockUpload.mockResolvedValueOnce({ data: { path: 'campaigns/my-image.png' }, error: null });
    mockGetPublicUrl.mockReturnValueOnce({ data: { publicUrl: 'https://supabase.co/storage/portal-media/campaigns/my-image.png' } });

    render(<CampaignsManager />);
    fireEvent.click(screen.getByText('Criar Campanha'));

    const uploaderInput = screen.getByLabelText(/Carregar imagem/i).parentElement?.querySelector('input[type="file"]');
    expect(uploaderInput).toBeInTheDocument();

    const file = new File(['dummy content'], 'my-image.png', { type: 'image/png' });
    
    await act(async () => {
      fireEvent.change(uploaderInput!, { target: { files: [file] } });
    });

    // Uploader deve ter chamado as APIs do Supabase e renderizado a prévia
    expect(mockUpload).toHaveBeenCalled();
    expect(mockGetPublicUrl).toHaveBeenCalled();
    expect(screen.getByAltText('Preview')).toBeInTheDocument();
  });

  it('deve tratar erro no upload de imagem de forma amigável', async () => {
    mockUpload.mockRejectedValueOnce(new Error('Erro no servidor do Supabase'));

    render(<CampaignsManager />);
    fireEvent.click(screen.getByText('Criar Campanha'));

    const uploaderInput = screen.getByLabelText(/Carregar imagem/i).parentElement?.querySelector('input[type="file"]');
    const file = new File(['dummy content'], 'my-image.png', { type: 'image/png' });

    await act(async () => {
      fireEvent.change(uploaderInput!, { target: { files: [file] } });
    });

    // Deve mostrar mensagem de erro
    expect(screen.getByText('Erro no servidor do Supabase')).toBeInTheDocument();
  });

  it('deve permitir a remoção da imagem carregada', async () => {
    mockUpload.mockResolvedValue({ data: { path: 'campaigns/my-image.png' }, error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://supabase.co/storage/portal-media/campaigns/my-image.png' } });

    render(<CampaignsManager />);
    fireEvent.click(screen.getByText('Criar Campanha'));

    const uploaderInput = screen.getByLabelText(/Carregar imagem/i).parentElement?.querySelector('input[type="file"]');
    const file = new File(['dummy content'], 'my-image.png', { type: 'image/png' });

    await act(async () => {
      fireEvent.change(uploaderInput!, { target: { files: [file] } });
    });

    expect(screen.getByAltText('Preview')).toBeInTheDocument();

    // Clica para remover
    const removeButton = screen.getByTitle('Remover');
    fireEvent.click(removeButton);

    // Deve voltar ao estado de upload vazio
    expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
    expect(screen.getByText('Clique para fazer upload')).toBeInTheDocument();
  });

  it('deve manter a imagem original durante a edição sem apagá-la ou requerer upload novamente', async () => {
    const mockCampaign = {
      id: 'existing-camp-456',
      title: 'Pizza Promo',
      description: 'Deliciosa',
      type: 'PROMO',
      status: 'ACTIVE',
      media_url: 'https://supabase.co/storage/portal-media/campaigns/pizza.png',
      media_type: 'IMAGE',
      campaign_audiences: [{ target_type: 'ALL', rules: {} }],
    };

    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ campaigns: [mockCampaign] }),
      })
    );

    render(<CampaignsManager />);

    await waitFor(() => {
      expect(screen.getByText('Pizza Promo')).toBeInTheDocument();
    });

    // Clica para editar
    fireEvent.click(screen.getByTitle('Editar campanha'));

    // Deve carregar a imagem existente na prévia
    expect(screen.getByAltText('Preview')).toBeInTheDocument();
    expect(screen.getByAltText('Preview')).toHaveAttribute('src', 'https://supabase.co/storage/portal-media/campaigns/pizza.png');

    // Salva sem re-enviar imagem (deve enviar media_url original ao backend)
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );

    fireEvent.click(screen.getByText('Salvar e Publicar'));

    // O payload enviado à API deve conter a URL da mídia original
    expect(mockFetch).toHaveBeenLastCalledWith('/api/admin/campaigns', expect.objectContaining({
      method: 'PUT',
      body: expect.stringContaining('"media_url":"https://supabase.co/storage/portal-media/campaigns/pizza.png"'),
    }));
  });
});
