import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Heart, ArrowLeft, Check, X, User, Building2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    cep: '',
    estado: '',
    cidade: '',
    rua: '',
    numero: ''
  });
  const [userType, setUserType] = useState<'client' | 'clinic'>('client');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'basic' | 'intermediary' | 'experience'>('free');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();

  // Validação de senha em tempo real
  const passwordValidation = {
    minLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== '';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    setFormData({
      ...formData,
      cep: cep
    });

    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            estado: data.uf,
            cidade: data.localidade,
            rua: data.logradouro
          }));
        } else {
          toast({
            title: "CEP não encontrado",
            description: "Por favor, verifique o CEP digitado.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao buscar CEP. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validações
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || 
        !formData.cep || !formData.estado || !formData.cidade || !formData.rua || !formData.numero) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Erro",
        description: "Por favor, insira um e-mail válido.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!isPasswordValid) {
      toast({
        title: "Erro",
        description: "A senha não atende aos critérios de segurança.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const userData = {
        ...formData,
        userType,
        plan: userType === 'clinic' ? selectedPlan : undefined
      };
      
      await register(formData.name, formData.email, formData.password, userType, userType === 'clinic' ? selectedPlan : undefined);
      
      toast({
        title: "Sucesso!",
        description: "Conta criada com sucesso. Faça login para continuar.",
      });
      
      navigate('/login');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar conta. Tente novamente.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-purple-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao início
          </Link>
          
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-12 h-12 gradient-purple rounded-full flex items-center justify-center">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
              VetFind
            </h1>
          </div>
          <p className="text-gray-600">Crie sua conta</p>
        </div>

        <Card className="shadow-lg border-purple-100">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-gray-800">
              Criar Conta
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Preencha os dados para criar sua conta
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Seleção do tipo de usuário */}
              <div className="space-y-3">
                <Label className="text-gray-700">Tipo de conta</Label>
                <RadioGroup defaultValue="client" value={userType} onValueChange={(value: 'client' | 'clinic') => setUserType(value)} className="flex space-x-4">
                  <label
                    className={`flex items-center space-x-2 border-2 rounded-lg p-4 flex-1 cursor-pointer transition-all duration-200 ease-in-out transform hover:shadow-md
                      ${userType === 'client' 
                        ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-purple-100 scale-[1.02]' 
                        : 'border-transparent hover:border-purple-200'}`}
                  >
                    <RadioGroupItem value="client" className="hidden" />
                    <div className={`p-2 rounded-full transition-colors duration-200 ${
                      userType === 'client' ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      <User className={`w-5 h-5 transition-colors duration-200 ${
                        userType === 'client' ? 'text-purple-600' : 'text-gray-500'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <span className={`font-medium transition-colors duration-200 ${
                        userType === 'client' ? 'text-purple-700' : 'text-gray-700'
                      }`}>Cliente</span>
                      <p className="text-xs text-gray-500">Buscar clínicas veterinárias</p>
                    </div>
                  </label>
                  <label
                    className={`flex items-center space-x-2 border-2 rounded-lg p-4 flex-1 cursor-pointer transition-all duration-200 ease-in-out transform hover:shadow-md
                      ${userType === 'clinic' 
                        ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-purple-100 scale-[1.02]' 
                        : 'border-transparent hover:border-purple-200'}`}
                  >
                    <RadioGroupItem value="clinic" className="hidden" />
                    <div className={`p-2 rounded-full transition-colors duration-200 ${
                      userType === 'clinic' ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      <Building2 className={`w-5 h-5 transition-colors duration-200 ${
                        userType === 'clinic' ? 'text-purple-600' : 'text-gray-500'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <span className={`font-medium transition-colors duration-200 ${
                        userType === 'clinic' ? 'text-purple-700' : 'text-gray-700'
                      }`}>Clínica</span>
                      <p className="text-xs text-gray-500">Gerenciar clínica veterinária</p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {/* Seleção de plano para clínicas */}
              {userType === 'clinic' && (
                <div className="space-y-3 mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                  <Label className="text-gray-700">Selecione seu plano</Label>
                  <RadioGroup 
                    value={selectedPlan} 
                    onValueChange={(value: 'free' | 'basic' | 'intermediary' | 'experience') => setSelectedPlan(value)} 
                    className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Plano Free */}
                    <label className="relative flex flex-col border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md border-transparent hover:border-purple-200">
                      <RadioGroupItem value="free" className="absolute right-4 top-4" />
                      <div className="mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">Free</h3>
                        <p className="text-sm text-gray-500">Comece gratuitamente</p>
                      </div>
                      <div className="text-2xl font-bold text-purple-600 mb-4">$0</div>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          Recursos básicos
                        </li>
                      </ul>
                    </label>

                    {/* Plano Basic */}
                    <label className="relative flex flex-col border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md border-transparent hover:border-purple-200">
                      <RadioGroupItem value="basic" className="absolute right-4 top-4" />
                      <div className="mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">Basic</h3>
                        <p className="text-sm text-gray-500">Para clínicas iniciantes</p>
                      </div>
                      <div className="flex items-baseline mb-4">
                        <span className="text-2xl font-bold text-purple-600">$10</span>
                        <span className="text-sm text-gray-500 ml-2">/mês</span>
                        <span className="text-sm text-purple-400 ml-2">ou $100/ano</span>
                      </div>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          Todos os recursos Free
                        </li>
                        <li className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          Suporte prioritário
                        </li>
                      </ul>
                    </label>

                    {/* Plano Intermediário */}
                    <label className="relative flex flex-col border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md border-transparent hover:border-purple-200">
                      <RadioGroupItem value="intermediary" className="absolute right-4 top-4" />
                      <div className="mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">Intermediário</h3>
                        <p className="text-sm text-gray-500">Para clínicas em crescimento</p>
                      </div>
                      <div className="flex items-baseline mb-4">
                        <span className="text-2xl font-bold text-purple-600">$25</span>
                        <span className="text-sm text-gray-500 ml-2">/mês</span>
                        <span className="text-sm text-purple-400 ml-2">ou $250/ano</span>
                      </div>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          Todos os recursos Basic
                        </li>
                        <li className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          Análise avançada
                        </li>
                      </ul>
                    </label>

                    {/* Plano Experience */}
                    <label className="relative flex flex-col border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md border-transparent hover:border-purple-200">
                      <RadioGroupItem value="experience" className="absolute right-4 top-4" />
                      <div className="mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">Experience</h3>
                        <p className="text-sm text-gray-500">Recursos completos</p>
                      </div>
                      <div className="flex items-baseline mb-4">
                        <span className="text-2xl font-bold text-purple-600">$50</span>
                        <span className="text-sm text-gray-500 ml-2">/mês</span>
                        <span className="text-sm text-purple-400 ml-2">ou $500/ano</span>
                      </div>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          Todos os recursos Intermediário
                        </li>
                        <li className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          Suporte 24/7
                        </li>
                        <li className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          Recursos exclusivos
                        </li>
                      </ul>
                    </label>
                  </RadioGroup>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700">
                  Nome completo
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  autoComplete="name"
                  className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  E-mail
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  autoComplete="email"
                  className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                />
              </div>

              {/* Campos de Endereço */}
              <div className="space-y-4 pt-4 border-t border-purple-100">
                <h3 className="text-lg font-semibold text-gray-800">Endereço</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="cep" className="text-gray-700">
                    CEP
                  </Label>
                  <Input
                    id="cep"
                    name="cep"
                    type="text"
                    placeholder="00000-000"
                    value={formData.cep}
                    onChange={handleCepChange}
                    required
                    maxLength={8}
                    className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estado" className="text-gray-700">
                      Estado
                    </Label>
                    <Input
                      id="estado"
                      name="estado"
                      type="text"
                      placeholder="UF"
                      value={formData.estado}
                      onChange={handleInputChange}
                      required
                      maxLength={2}
                      className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cidade" className="text-gray-700">
                      Cidade
                    </Label>
                    <Input
                      id="cidade"
                      name="cidade"
                      type="text"
                      placeholder="Sua cidade"
                      value={formData.cidade}
                      onChange={handleInputChange}
                      required
                      className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rua" className="text-gray-700">
                    Rua/Avenida
                  </Label>
                  <Input
                    id="rua"
                    name="rua"
                    type="text"
                    placeholder="Nome da rua ou avenida"
                    value={formData.rua}
                    onChange={handleInputChange}
                    required
                    className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero" className="text-gray-700">
                    Número
                  </Label>
                  <Input
                    id="numero"
                    name="numero"
                    type="text"
                    placeholder="Número da residência"
                    value={formData.numero}
                    onChange={handleInputChange}
                    required
                    className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    autoComplete="new-password"
                    className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                
                {/* Critérios de senha */}
                {formData.password && (
                  <div className="mt-2 space-y-1 text-xs">
                    <div className={`flex items-center ${passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordValidation.minLength ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                      Mínimo 8 caracteres
                    </div>
                    <div className={`flex items-center ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordValidation.hasUpperCase ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                      Uma letra maiúscula
                    </div>
                    <div className={`flex items-center ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordValidation.hasLowerCase ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                      Uma letra minúscula
                    </div>
                    <div className={`flex items-center ${passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordValidation.hasNumber ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                      Um número
                    </div>
                    <div className={`flex items-center ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordValidation.hasSpecialChar ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                      Um caractere especial
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700">
                  Confirmar senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    autoComplete="new-password"
                    className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                {formData.confirmPassword && (
                  <div className={`flex items-center text-xs mt-1 ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordsMatch ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                    Senhas coincidem
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full gradient-purple text-white hover:opacity-90 transition-opacity"
                disabled={isLoading || !isPasswordValid || !passwordsMatch}
              >
                {isLoading ? "Criando conta..." : "Criar conta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{' '}
                <Link
                  to="/login"
                  className="text-purple-600 hover:text-purple-700 font-medium hover:underline"
                >
                  Faça login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>🔒 Suas informações estão protegidas com criptografia de ponta a ponta</p>
        </div>
      </div>
    </div>
  );
};

export default Register;
