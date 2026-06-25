import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Heart, ArrowLeft, Check, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { EMAIL_ALREADY_REGISTERED } from '@/contexts/AuthContext';
import BreedSelector from '@/components/BreedSelector';
import { supabase } from '@/lib/supabase';
import HCaptchaWidget from '@/components/HCaptchaWidget';
import type HCaptcha from '@hcaptcha/react-hcaptcha';
import { sanitizeLine, sanitizeMultiline } from '@/lib/sanitize';
import { validateCPF } from '@/lib/cpf';

const ClientRegister = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cep: '',
    estado: '',
    cidade: '',
    rua: '',
    numero: ''
  });
  const [petData, setPetData] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
    weight: '',
    color: '',
    notes: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef<HCaptcha>(null);
  const captchaRequired = !!import.meta.env.VITE_HCAPTCHA_SITE_KEY;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();

  const passwordValidation = {
    minLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== '';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePetInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPetData({ ...petData, [e.target.name]: e.target.value });
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
    let masked = digits;
    if (digits.length > 9) masked = `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
    else if (digits.length > 6) masked = `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6)}`;
    else if (digits.length > 3) masked = `${digits.slice(0,3)}.${digits.slice(3)}`;
    setFormData(prev => ({ ...prev, cpf: masked }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
    let masked = digits;
    if (digits.length > 10) masked = `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
    else if (digits.length > 6) masked = `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
    else if (digits.length > 2) masked = `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    else if (digits.length > 0) masked = `(${digits}`;
    setFormData(prev => ({ ...prev, phone: masked }));
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, cep });

    if (cep.length === 8) {
      try {
        const allowedDomains = ['viacep.com.br'];
        const sanitizedCep = cep.replace(/[^0-9]/g, '');
        const targetUrl = new URL(`https://viacep.com.br/ws/${sanitizedCep}/json/`);
        const hostname = targetUrl.hostname;
        if (
          !allowedDomains.includes(hostname) ||
          /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(hostname) ||
          hostname === 'localhost'
        ) {
          throw new Error('Request blocked');
        }
        const response = await fetch(targetUrl.toString());
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            estado: data.uf,
            cidade: data.localidade,
            rua: data.logradouro
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP');
      }
    }
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.cpf || !formData.birthDate || !formData.password || !formData.confirmPassword) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return false;
    }
    if (!validateCPF(formData.cpf)) {
      toast({ title: "CPF inválido", description: "Verifique os dígitos do CPF.", variant: "destructive" });
      return false;
    }
    const birth = new Date(formData.birthDate);
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 18);
    if (birth > cutoff) {
      toast({ title: "Idade mínima", description: "É necessário ter pelo menos 18 anos para se cadastrar.", variant: "destructive" });
      return false;
    }
    if (!isPasswordValid || !passwordsMatch) {
      toast({ title: "Erro", description: "Senha inválida ou senhas não coincidem.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.phone || !formData.cep || !formData.estado || !formData.cidade || !formData.rua || !formData.numero) {
      toast({ title: "Erro", description: "Preencha todos os campos de endereço.", variant: "destructive" });
      return false;
    }
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      toast({ title: "Telefone inválido", description: "O telefone deve ter 10 ou 11 dígitos.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!petData.name || !petData.species || !petData.breed) {
      toast({ title: "Erro", description: "Nome, espécie e raça do pet são obrigatórios.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    if (captchaRequired && !captchaToken) {
      toast({ title: 'Complete a verificação de segurança', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const newUser = await register(formData.name, formData.email, formData.password, 'client', undefined, captchaToken || undefined, formData.cpf.replace(/\D/g, ''));

      if (newUser) {
        const weightNum = petData.weight ? parseFloat(String(petData.weight).replace(/[^\d.]/g, '')) || null : null;
        await supabase.from('pets').insert({
          owner_id: newUser.id,
          name:     sanitizeLine(petData.name),
          species:  petData.species as any,
          breed:    sanitizeLine(petData.breed),
          weight:   weightNum,
        });

        toast({ title: "Sucesso!", description: "Conta criada com sucesso!" });
        navigate('/');
      } else {
        toast({
          title: "Quase lá!",
          description: "Verifique seu e-mail para confirmar a conta e depois faça login.",
        });
        navigate('/login');
      }
    } catch (error) {
      captchaRef.current?.resetCaptcha();
      setCaptchaToken('');

      // Se o e-mail já está cadastrado, redireciona para o login.
      if (error instanceof Error && (error as any).code === EMAIL_ALREADY_REGISTERED) {
        toast({
          title: "Conta já existente",
          description: "Esse e-mail já possui uma conta. Redirecionando para o login...",
        });
        navigate('/login');
        return;
      }

      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar conta.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-purple-light flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
          
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-12 h-12 gradient-purple rounded-full flex items-center justify-center">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
              Paw Connect
            </h1>
          </div>
          <p className="text-gray-600">Cadastro de Cliente</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep > step ? 'bg-green-500 text-white' :
                  currentStep === step ? 'bg-purple-600 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {currentStep > step ? <Check className="w-5 h-5" /> : step}
                </div>
                <span className="text-xs mt-1 text-gray-600">
                  {step === 1 ? 'Dados' : step === 2 ? 'Endereço' : 'Pet'}
                </span>
              </div>
              {step < 3 && (
                <div className={`w-16 h-1 mx-2 ${currentStep > step ? 'bg-green-500' : 'bg-gray-300'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <Card className="shadow-lg border-purple-100">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-gray-800">
              Etapa {currentStep} de 3
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              {currentStep === 1 && 'Informações pessoais'}
              {currentStep === 2 && 'Endereço completo'}
              {currentStep === 3 && 'Cadastre seu pet'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Step 1: Personal Data */}
              {currentStep === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ex: Maria da Silva" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="maria@email.com" autoComplete="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" name="cpf" inputMode="numeric" maxLength={14} value={formData.cpf} onChange={handleCpfChange} placeholder="000.000.000-00" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Data de nascimento</Label>
                    <Input
                      id="birthDate"
                      name="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Mínimo 8 caracteres"
                        autoComplete="new-password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {formData.password && (
                      <div className="space-y-1 text-xs">
                        <div className={passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}>
                          {passwordValidation.minLength ? <Check className="w-3 h-3 inline mr-1" /> : <X className="w-3 h-3 inline mr-1" />}
                          Mínimo 8 caracteres
                        </div>
                        <div className={passwordValidation.hasUpperCase ? 'text-green-600' : 'text-red-600'}>
                          {passwordValidation.hasUpperCase ? <Check className="w-3 h-3 inline mr-1" /> : <X className="w-3 h-3 inline mr-1" />}
                          Uma letra maiúscula
                        </div>
                        <div className={passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}>
                          {passwordValidation.hasNumber ? <Check className="w-3 h-3 inline mr-1" /> : <X className="w-3 h-3 inline mr-1" />}
                          Um número
                        </div>
                        <div className={passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-red-600'}>
                          {passwordValidation.hasSpecialChar ? <Check className="w-3 h-3 inline mr-1" /> : <X className="w-3 h-3 inline mr-1" />}
                          Um caractere especial
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar senha</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Repita a senha acima"
                        autoComplete="new-password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {formData.confirmPassword && (
                      <div className={`text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                        {passwordsMatch ? <Check className="w-3 h-3 inline mr-1" /> : <X className="w-3 h-3 inline mr-1" />}
                        Senhas coincidem
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Step 2: Address */}
              {currentStep === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" name="phone" inputMode="numeric" maxLength={16} value={formData.phone} onChange={handlePhoneChange} placeholder="(11) 99999-9999" autoComplete="tel" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input id="cep" name="cep" value={formData.cep} onChange={handleCepChange} placeholder="00000-000" maxLength={8} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Input id="estado" name="estado" value={formData.estado} onChange={handleInputChange} placeholder="SP" maxLength={2} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input id="cidade" name="cidade" value={formData.cidade} onChange={handleInputChange} placeholder="São Paulo" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rua">Rua / Endereço</Label>
                    <Input id="rua" name="rua" value={formData.rua} onChange={handleInputChange} placeholder="Rua das Flores, 123" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input id="numero" name="numero" value={formData.numero} onChange={handleInputChange} placeholder="123" required />
                  </div>
                </>
              )}

              {/* Step 3: Pet */}
              {currentStep === 3 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="petName">Nome do Pet *</Label>
                    <Input id="petName" name="name" value={petData.name} onChange={handlePetInputChange} placeholder="Ex: Rex" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="petSpecies">Espécie *</Label>
                    <Select onValueChange={(value) => setPetData({ ...petData, species: value, breed: '' })} value={petData.species}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a espécie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dog">Cachorro</SelectItem>
                        <SelectItem value="cat">Gato</SelectItem>
                        <SelectItem value="bird">Pássaro</SelectItem>
                        <SelectItem value="rabbit">Coelho</SelectItem>
                        <SelectItem value="hamster">Hamster</SelectItem>
                        <SelectItem value="fish">Peixe</SelectItem>
                        <SelectItem value="reptile">Réptil</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="petBreed">Raça *</Label>
                    <BreedSelector
                      species={petData.species}
                      value={petData.breed}
                      onChange={(value) => setPetData({ ...petData, breed: value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="petAge">Idade</Label>
                      <Input id="petAge" name="age" value={petData.age} onChange={handlePetInputChange} placeholder="Ex: 2 anos" />
                    </div>
                    {(petData.species === 'dog' || petData.species === 'cat') && (
                      <div className="space-y-2">
                        <Label htmlFor="petWeight">Peso</Label>
                        <Input id="petWeight" name="weight" value={petData.weight} onChange={handlePetInputChange} placeholder="Ex: 15kg" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="petColor">Cor</Label>
                    <Input id="petColor" name="color" value={petData.color} onChange={handlePetInputChange} placeholder="Ex: Caramelo" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="petNotes">Observações</Label>
                    <Textarea id="petNotes" name="notes" value={petData.notes} onChange={handlePetInputChange} placeholder="Ex: Tem alergia a frango, toma remédio diário..." rows={3} />
                  </div>
                </>
              )}

              {/* Consentimento LGPD — exibido apenas no último step */}
              {currentStep === 3 && (
                <div className="flex items-start gap-3 py-2">
                  <Checkbox
                    id="consent"
                    checked={consentAccepted}
                    onCheckedChange={(v) => setConsentAccepted(v === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="consent" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
                    Li e aceito os{' '}
                    <Link to="/termos" target="_blank" className="text-purple-600 hover:underline font-medium">Termos de Uso</Link>
                    {' '}e a{' '}
                    <Link to="/privacidade" target="_blank" className="text-purple-600 hover:underline font-medium">Política de Privacidade</Link>
                    , incluindo o tratamento dos meus dados pessoais conforme descrito.
                  </label>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-4">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                )}
                {currentStep < 3 ? (
                  <Button type="button" onClick={handleNext} className="flex-1 gradient-purple text-white">
                    Próximo
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <>
                    <HCaptchaWidget
                      ref={captchaRef}
                      onVerify={setCaptchaToken}
                      onExpire={() => setCaptchaToken('')}
                    />
                    <Button type="submit" disabled={isLoading || !consentAccepted || (captchaRequired && !captchaToken)} className="flex-1 gradient-purple text-white">
                      {isLoading ? "Criando conta..." : "Finalizar cadastro"}
                    </Button>
                  </>
                )}
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium hover:underline">
                  Entrar
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientRegister;
