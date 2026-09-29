import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare, Send, Paperclip, User, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { marketplaceService } from '../../services/marketplaceService';
import { Conversation, Message } from '../../types';

export const SellerMessagesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const recipientParam = searchParams.get('recipient');

  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const loadConversations = async () => {
      setLoading(true);
      try {
        let convList = await marketplaceService.getConversations(currentUser.uid);

        if (recipientParam && !convList.some((c) => c.participants.includes(recipientParam))) {
          // Create or retrieve conversation
          const created = await marketplaceService.getOrCreateConversation(currentUser.uid, recipientParam);
          convList = [created, ...convList];
        }

        setConversations(convList);
        if (convList.length > 0) {
          const selected = recipientParam
            ? convList.find((c) => c.participants.includes(recipientParam)) || convList[0]
            : convList[0];
          setActiveConv(selected);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [currentUser, recipientParam]);

  useEffect(() => {
    if (!activeConv) return;
    marketplaceService
      .getMessages(activeConv.id)
      .then(setMessages)
      .catch((err) => console.error('Error loading messages:', err));
  }, [activeConv]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !currentUser || !newMessageText.trim()) return;

    setSending(true);
    try {
      const msg = await marketplaceService.sendMessage(
        activeConv.id,
        currentUser.uid,
        newMessageText.trim()
      );
      setMessages([...messages, msg]);
      setNewMessageText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101312]">
          Messages
        </h1>
        <p className="text-xs text-[#6E746F] mt-1">
          Direct communication with buyers and store contacts
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-[#E2E4DF] shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-3 min-h-[550px]">
        {/* Left: Conversation List */}
        <div className={`border-r border-[#E2E4DF] p-4 flex flex-col ${activeConv ? 'hidden md:flex' : 'flex'}`}>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#6E746F] mb-3">
            Conversations ({conversations.length})
          </h2>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-[#6E746F] py-8 text-center">
              No conversations yet. When customers reach out to your store, threads appear here.
            </p>
          ) : (
            <div className="space-y-1.5 overflow-y-auto flex-1">
              {conversations.map((conv) => {
                const otherParticipant = conv.participants.find((p) => p !== currentUser?.uid) || 'User';
                const isSelected = activeConv?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full p-3 rounded-2xl text-left transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-[#123C2F] text-white shadow-xs'
                        : 'hover:bg-[#F7F7F3] text-[#101312]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#F4C430]/30 text-[#101312] font-bold flex items-center justify-center shrink-0 text-xs">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">Buyer {otherParticipant.slice(0, 6)}</p>
                      <p
                        className={`text-[11px] truncate ${
                          isSelected ? 'text-[#E2E4DF]' : 'text-[#6E746F]'
                        }`}
                      >
                        {conv.last_message || 'Start conversation...'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Active Conversation Messages */}
        <div className={`md:col-span-2 flex flex-col h-[550px] ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
          {activeConv ? (
            <>
              {/* Conversation Top Header */}
              <div className="p-4 border-b border-[#E2E4DF] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveConv(null)}
                    className="md:hidden p-1 text-[#6E746F]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h3 className="text-xs font-bold text-[#101312]">
                      Buyer conversation thread
                    </h3>
                    <p className="text-[10px] text-[#6E746F]">Thread ID: {activeConv.id.slice(0, 12)}</p>
                  </div>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F7F7F3]/40">
                {messages.length === 0 ? (
                  <p className="text-xs text-[#6E746F] text-center py-12">
                    Send a message below to connect with this buyer.
                  </p>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === currentUser?.uid;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                            isMe
                              ? 'bg-[#123C2F] text-white rounded-br-xs'
                              : 'bg-white border border-[#E2E4DF] text-[#101312] rounded-bl-xs'
                          }`}
                        >
                          <p>{m.text}</p>
                        </div>
                        <span className="text-[10px] text-[#6E746F]/70 px-1 mt-1">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Message Form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-[#E2E4DF] bg-white flex items-center gap-2">
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-[#E2E4DF] focus:outline-none focus:border-[#101312]"
                />
                <Button variant="secondary" size="md" isLoading={sending} icon={<Send className="w-3.5 h-3.5" />}>
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#6E746F]">
              <MessageSquare className="w-10 h-10 text-[#E2E4DF] mb-2" />
              <p className="text-xs">Select a conversation from the left to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
