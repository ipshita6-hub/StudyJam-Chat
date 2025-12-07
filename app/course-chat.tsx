import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { auth, db } from '../FirebaseConfig';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: any;
  type: 'text' | 'file' | 'video';
  reactions: any[];
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

export default function CourseChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const courseId = params.courseId as string;
  const fromAdmin = params.from === 'admin';
  const [message, setMessage] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!courseId) return;

    const messagesRef = collection(db, 'courses', courseId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: Message[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(messagesData);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsubscribe();
  }, [courseId]);

  const handleSendMessage = async () => {
    if (!message.trim() || !courseId || !currentUser) return;

    const messageContent = message.trim();
    setMessage('');

    try {
      await addDoc(collection(db, 'courses', courseId, 'messages'), {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'User',
        content: messageContent,
        type: 'text',
        timestamp: serverTimestamp(),
        reactions: [],
      });

      await updateDoc(doc(db, 'courses', courseId), {
        lastMessage: messageContent,
        lastMessageTime: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(messageContent);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => fromAdmin ? router.replace('/admin/chat') : router.replace('/(tabs)/chats')} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{params.courseName || 'Course Chat'}</Text>
            <Text style={styles.headerSubtitle}>{params.members || '0'} members</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="information-circle" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 && (
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubbles-outline" size={64} color="#555" />
              <Text style={styles.emptyChatText}>No messages yet</Text>
              <Text style={styles.emptyChatSubtext}>Start the conversation!</Text>
            </View>
          )}
          {messages.map((msg) => {
            const isMine = msg.senderId === currentUser?.uid;
            const messageTime = msg.timestamp?.toDate?.()?.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }) || '';

            return (
              <View key={msg.id}>
                <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
                  {!isMine && (
                    <View style={styles.senderInfo}>
                      <Text style={styles.senderName}>{msg.senderName}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onLongPress={() => setSelectedMessageId(msg.id)}
                    style={[styles.messageBubble, isMine && styles.messageBubbleMine]}
                  >
                    {selectedMessageId === msg.id && (
                      <View style={styles.reactionPickerContainer}>
                        {REACTION_EMOJIS.map((emoji) => (
                          <TouchableOpacity
                            key={emoji}
                            style={styles.reactionOption}
                            onPress={() => setSelectedMessageId(null)}
                          >
                            <Text style={styles.reactionEmoji}>{emoji}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    <Text style={[styles.messageText, isMine && styles.messageTextMine]}>
                      {msg.content}
                    </Text>
                  </TouchableOpacity>
                  {isMine && (
                    <View style={styles.messageStatus}>
                      <Text style={styles.messageTime}>{messageTime}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor={Colors.textGray}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!message.trim()}
          >
            <Ionicons name="send" size={20} color={message.trim() ? Colors.black : Colors.textGray} />
          </TouchableOpacity>
        </View>

        {selectedMessageId && (
          <TouchableWithoutFeedback onPress={() => setSelectedMessageId(null)}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textGray,
    marginTop: 2,
  },
  iconButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyChatText: {
    color: '#555',
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
  emptyChatSubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  messageRow: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  messageRowMine: {
    alignItems: 'flex-end',
  },
  senderInfo: {
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  messageBubble: {
    backgroundColor: Colors.black,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    maxWidth: '80%',
    position: 'relative',
  },
  messageBubbleMine: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  messageText: {
    fontSize: 14,
    color: Colors.white,
    lineHeight: 20,
  },
  messageTextMine: {
    color: Colors.black,
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    color: Colors.textGray,
  },
  reactionPickerContainer: {
    position: 'absolute',
    top: -50,
    left: 0,
    backgroundColor: '#2A2A2A',
    borderRadius: 24,
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    zIndex: 100,
  },
  reactionOption: {
    padding: 4,
  },
  reactionEmoji: {
    fontSize: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
    backgroundColor: Colors.background,
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.black,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.white,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.border,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
});