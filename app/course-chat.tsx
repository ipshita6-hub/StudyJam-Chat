import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
  pinned?: boolean;
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
  const [showMessageOptions, setShowMessageOptions] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const getCurrentUser = () => auth.currentUser;

  useEffect(() => {
    if (!courseId) return;

    const messagesRef = collection(db, 'courses', courseId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: Message[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      
      // Sort messages: pinned first, then by timestamp
      const sortedMessages = messagesData.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
      });
      
      setMessages(sortedMessages);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsubscribe();
  }, [courseId]);

  const handleSendMessage = async () => {
    const currentUser = getCurrentUser();
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
        pinned: false,
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

  const handleTogglePin = async (messageId: string, currentPinned: boolean) => {
    if (!courseId) {
      console.log('No courseId available');
      return;
    }

    console.log('Toggling pin for message:', messageId, 'Current pinned:', currentPinned);

    try {
      const messageRef = doc(db, 'courses', courseId, 'messages', messageId);
      await updateDoc(messageRef, {
        pinned: !currentPinned,
      });
      console.log('Pin toggled successfully');
      setShowMessageOptions(null);
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!courseId) {
      console.log('No courseId available');
      return;
    }

    const confirmDelete = Platform.OS === 'web' 
      ? window.confirm('Are you sure you want to delete this message?')
      : true;

    if (!confirmDelete && Platform.OS === 'web') return;

    if (Platform.OS !== 'web') {
      Alert.alert(
        'Delete Message',
        'Are you sure you want to delete this message?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await performDelete(messageId);
            },
          },
        ]
      );
    } else {
      await performDelete(messageId);
    }
  };

  const performDelete = async (messageId: string) => {
    try {
      console.log('Deleting message:', messageId);
      const messageRef = doc(db, 'courses', courseId, 'messages', messageId);
      await deleteDoc(messageRef);
      console.log('Message deleted successfully');
      setShowMessageOptions(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      if (Platform.OS === 'web') {
        alert('Failed to delete message. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to delete message. Please try again.');
      }
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    const currentUser = getCurrentUser();
    if (!courseId || !currentUser) {
      console.log('Missing courseId or currentUser');
      return;
    }

    console.log('Adding reaction:', emoji, 'to message:', messageId);

    try {
      const messageRef = doc(db, 'courses', courseId, 'messages', messageId);
      const message = messages.find(m => m.id === messageId);
      
      if (!message) {
        console.log('Message not found');
        return;
      }

      const existingReactions = message.reactions || [];
      const userReactionIndex = existingReactions.findIndex(
        (r: any) => r.userId === currentUser.uid && r.emoji === emoji
      );

      let updatedReactions;
      if (userReactionIndex >= 0) {
        // Remove reaction if already exists
        console.log('Removing existing reaction');
        updatedReactions = existingReactions.filter((_: any, i: number) => i !== userReactionIndex);
      } else {
        // Add new reaction
        console.log('Adding new reaction');
        updatedReactions = [...existingReactions, { userId: currentUser.uid, emoji }];
      }

      await updateDoc(messageRef, {
        reactions: updatedReactions,
      });
      
      console.log('Reaction updated successfully');
      setSelectedMessageId(null);
      setShowMessageOptions(null);
    } catch (error) {
      console.error('Error adding reaction:', error);
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
            const currentUser = getCurrentUser();
            const isMine = msg.senderId === currentUser?.uid;
            const messageTime = msg.timestamp?.toDate?.()?.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }) || '';

            return (
              <View key={msg.id}>
                {msg.pinned && (
                  <View style={styles.pinnedBadge}>
                    <Ionicons name="pin" size={12} color={Colors.primary} />
                    <Text style={styles.pinnedText}>Pinned Message</Text>
                  </View>
                )}
                <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
                  {!isMine && (
                    <View style={styles.senderInfo}>
                      <Text style={styles.senderName}>{msg.senderName}</Text>
                    </View>
                  )}
                  <Pressable
                    onLongPress={() => {
                      console.log('Long press detected on message:', msg.id);
                      setShowMessageOptions(msg.id);
                      setSelectedMessageId(null);
                    }}
                    delayLongPress={400}
                  >
                    <View
                      style={[
                        styles.messageBubble, 
                        isMine && styles.messageBubbleMine,
                        msg.pinned && styles.messageBubblePinned
                      ]}
                    >
                      <Text style={[styles.messageText, isMine && styles.messageTextMine]}>
                        {msg.content}
                      </Text>
                      {msg.reactions && msg.reactions.length > 0 && (
                        <View style={styles.reactionsContainer}>
                          {Object.entries(
                            msg.reactions.reduce((acc: any, r: any) => {
                              acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([emoji, count]) => {
                            const hasUserReacted = msg.reactions.some(
                              (r: any) => r.userId === currentUser?.uid && r.emoji === emoji
                            );
                            return (
                              <TouchableOpacity
                                key={emoji}
                                style={[
                                  styles.reactionBadge,
                                  hasUserReacted && styles.reactionBadgeActive
                                ]}
                                onPress={() => {
                                  console.log('Reaction badge pressed:', emoji);
                                  handleAddReaction(msg.id, emoji);
                                }}
                              >
                                <Text style={styles.reactionBadgeEmoji}>{emoji}</Text>
                                <Text style={styles.reactionBadgeCount}>{String(count)}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  </Pressable>
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
      </KeyboardAvoidingView>

      {/* Message Options Modal */}
      <Modal
        visible={showMessageOptions !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMessageOptions(null)}
      >
        <Pressable 
          style={styles.modalBackdrop}
          onPress={() => setShowMessageOptions(null)}
        >
          <View style={styles.modalContent}>
            {(() => {
              const msg = messages.find(m => m.id === showMessageOptions);
              if (!msg) return null;
              const currentUser = getCurrentUser();
              const isMine = msg.senderId === currentUser?.uid;
              
              return (
                <>
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => handleTogglePin(msg.id, msg.pinned || false)}
                  >
                    <Ionicons 
                      name={msg.pinned ? "pin" : "pin-outline"} 
                      size={24} 
                      color={Colors.white} 
                    />
                    <Text style={styles.modalOptionText}>
                      {msg.pinned ? 'Unpin Message' : 'Pin Message'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => {
                      setShowMessageOptions(null);
                      setSelectedMessageId(msg.id);
                    }}
                  >
                    <Ionicons name="happy-outline" size={24} color={Colors.white} />
                    <Text style={styles.modalOptionText}>Add Reaction</Text>
                  </TouchableOpacity>
                  
                  {isMine && (
                    <TouchableOpacity
                      style={[styles.modalOption, styles.modalOptionDanger]}
                      onPress={() => handleDeleteMessage(msg.id)}
                    >
                      <Ionicons name="trash-outline" size={24} color="#FF4444" />
                      <Text style={[styles.modalOptionText, { color: '#FF4444' }]}>Delete Message</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.modalOption, styles.modalOptionCancel]}
                    onPress={() => setShowMessageOptions(null)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </Pressable>
      </Modal>

      {/* Reaction Picker Modal */}
      <Modal
        visible={selectedMessageId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMessageId(null)}
      >
        <Pressable 
          style={styles.modalBackdrop}
          onPress={() => setSelectedMessageId(null)}
        >
          <View style={styles.reactionPickerModal}>
            <Text style={styles.reactionPickerTitle}>Add Reaction</Text>
            <View style={styles.reactionPickerRow}>
              {REACTION_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactionPickerOption}
                  onPress={() => {
                    if (selectedMessageId) {
                      handleAddReaction(selectedMessageId, emoji);
                    }
                  }}
                >
                  <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
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
    paddingHorizontal: 16,
    position: 'relative',
  },
  messageBubbleMine: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  messageBubblePinned: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  pinnedText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },

  messageText: {
    fontSize: 15,
    color: Colors.white,
    lineHeight: 22,
    flexWrap: 'wrap',
    flexShrink: 1,
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

  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  reactionBadgeActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  reactionBadgeEmoji: {
    fontSize: 14,
  },
  reactionBadgeCount: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 8,
    minWidth: 250,
    maxWidth: '80%',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  modalOptionText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  modalOptionDanger: {
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  modalOptionCancel: {
    borderTopWidth: 1,
    borderTopColor: '#444',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    color: Colors.textGray,
    fontSize: 16,
    textAlign: 'center',
  },
  reactionPickerModal: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  reactionPickerTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  reactionPickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  reactionPickerOption: {
    padding: 8,
  },
  reactionPickerEmoji: {
    fontSize: 32,
  },
});