import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { chatAPI, authAPI } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOW, FONTS } from '../config/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatScreen({ navigation }: any) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hello kaham de tong? 👋 How can I help you learn or translate today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const res = await authAPI.me();
      const name = res.data.name?.split(' ')[0] || 'Friend';
      setMessages(prev => {
        const newMsgs = [...prev];
        if (newMsgs.length === 1 && newMsgs[0].id === '1') {
          newMsgs[0].content = `Hello, ${name} kaham de tong? 👋 How can I help you learn or translate today?`;
        }
        return newMsgs;
      });
    } catch (e) {
      console.log('Could not load user profile for greeting');
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // We pass the history to the backend
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await chatAPI.sendMessage(apiMessages);
      
      const assistantMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: res.data.message || 'Sorry, I could not generate a response.' 
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (e: any) {
      console.error(e);
      let errorMsg = 'I am having trouble connecting to my brain (Ollama). Please make sure the local Ollama service is running.';
      
      if (e.message?.includes('timeout')) {
        errorMsg = 'My brain took too long to respond. The local AI might be loading or busy.';
      } else if (e.response?.data?.detail) {
        errorMsg = e.response.data.detail;
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMsg
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperAssistant]}>
        {!isUser && (
          <View style={styles.assistantAvatar}>
            <Ionicons name="sparkles" size={14} color={COLORS.gold} />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.messageUser : styles.messageAssistant]}>
          <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextAssistant]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>AI Assistant</Text>
          <Text style={styles.headerSubtitle}>Powered by local Ollama</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputArea}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask me anything..."
              placeholderTextColor={COLORS.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} 
              onPress={sendMessage}
              disabled={!input.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="arrow-up" size={20} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  backBtn: { padding: SPACING.xs },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, fontFamily: FONTS.serif },
  headerSubtitle: { fontSize: 11, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  headerRight: { width: 32 },
  
  keyboardView: { flex: 1 },
  listContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  
  messageWrapper: { flexDirection: 'row', marginBottom: SPACING.md, alignItems: 'flex-end' },
  messageWrapperUser: { justifyContent: 'flex-end' },
  messageWrapperAssistant: { justifyContent: 'flex-start' },
  
  assistantAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  
  messageBubble: { maxWidth: '80%', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, ...SHADOW.sm },
  messageUser: { 
    backgroundColor: COLORS.primary, 
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: 4 
  },
  messageAssistant: { 
    backgroundColor: COLORS.white, 
    borderWidth: 1, borderColor: COLORS.border,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, borderBottomLeftRadius: 4, borderBottomRightRadius: RADIUS.xl 
  },
  
  messageText: { fontSize: 15, lineHeight: 22 },
  messageTextUser: { color: COLORS.white },
  messageTextAssistant: { color: COLORS.textPrimary },
  
  inputArea: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: COLORS.bgCardAlt,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    minHeight: 40, maxHeight: 120,
    color: COLORS.textPrimary,
    fontSize: 15,
    paddingTop: 10, paddingBottom: 10,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: SPACING.sm,
    marginBottom: 2,
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.textMuted,
  }
});
