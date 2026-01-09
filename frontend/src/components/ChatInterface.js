// frontend/src/components/ChatInterface.js
import React,{useState,useRef,useEffect} from 'react';
import{
    Box,
    Paper,
    TextField,
    IconButton,
    Typography,
    CircularProgress,
    Chip,
    Avatar,
    Divider,
    Button
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import ReactMarkdown from "react-markdown";
import {sendChatMessage,clearChatHistory} from "../services/api";

function ChatInterface({onNotification}){
    const [messages,setMessages] = useState([]);
    const [input,setInput] = useState('');
    const [loading,setLoading] = useState(false);
    const [sessionId,setSessionId]= useState(null);
    const messagesEndRef = useRef(null);

    // auto scroll to bottom
    const scrollToBottom = ()=>{
        messagesEndRef.current?.scrollIntoView({behavior:"smooth"});
   };
   useEffect(()=>{
    scrollToBottom();
   },[messages]);
   // send messages
   const handleSend = async()=>{
    if(!input.trim()||loading) return;
    const userMessage = {
        role:"user",
        content:input,
        timestamp:new Date().toISOString()
    };
    setMessages((prev)=>[...prev,userMessage]);
    setInput("");
    setLoading(true);
    try{
    const response = await sendChatMessage(input,sessionId);
    // save sessionId
    if(!sessionId){
        setSessionId(response.sessionId);
    }
    const assistantMessage={
        role:"assistant",
        content:response.message,
        timestamp:new Date().toISOString(),
        usage:response.usage
    };
    setMessages((prev)=>[...prev,assistantMessage]);
    onNotification("messages send successfully","success");

    }catch(error){
        onNotification(`send failed:${error.message}`,"error");
    }finally{
        setLoading(false);
    }
   };

   // clear history
   const handleClear = async()=>{
    if(!sessionId){
        setMessages([]);
        return;
    }
    try{
      await clearChatHistory(sessionId);
      setMessages([]);
      setSessionId(null);
      onNotification("chat history has been cleared","success");
    }catch(error){
     onNotification(`clear failed:${error.message}`,"error");
    }
   };
   // enter send
   const handleKeyPress = (e)=>{
    if(e.key === "Enter" && !e.shiftKey){
        e.preventDefault();
        handleSend();
    }
   };
   return(
    <Paper elevation={2} sx={{height:"calc(100vh - 220px)",display:"flex",flexDirection:"column"}}>
        {/**chat head */}
        <Box sx={{
            p:2,
            borderBottom:"1px solid #e0e0e0",
            display:"flex",
            justifyContent:"space-between",
            alignItems:"center",
            backgroundColor:"#fafafa"
        }}>
            <Box>
                <Typography variant='h6'>AI chat assistant</Typography>
                <Typography variant='caption' color="text.secondary">
                    {sessionId ? `session ID: ${sessionId.slice(0,15)}...`:'new session'}
                </Typography>
            </Box>
            <Button
             variant='outlined'
             size='small'
             startIcon={<DeleteIcon/>}
             onClick={handleClear}
             disabled={messages.length===0}>
                clear history
             </Button>
        </Box>
        {/**messages list */}
        <Box
        sx={{
            flex:1,
            overflowY:"auto",
            p:2,
            backgroundColor:"#f5f5f5"
        }}>
            {messages.length===0?(
                <Box
                sx={{
                    height:"100%",
                    display:"flex",
                    flexDirection:"column",
                    justifyContent:"center",
                    alignItems:"center",
                    color:"text.secondary"
                }}
                >
                    <SmartToyIcon sx={{fontSize:60,mb:2,opacity:0.3}} />
                    <Typography variant='h6' gutterBottom>
                        begin chat
                    </Typography>
                    <Typography variant='body2' align="center">
                        input your probems,AI assistant will help you answer
                    </Typography>
                </Box>
            ):(
                messages.map((message,index)=>(
                    <MessageBubble key={index} message={message}/>
                ))
            )}
            <div ref={messagesEndRef} />
        </Box>
        {/**input area */}
        <Box
        sx={{p:2,
            borderTop:"1px solid #e0e0e0",
            backgroundColor:"#fff"
        }}>
            <Box sx={{display:"flex",gap:1}}>
                <TextField 
                fullWidth
                multiline
                maxRows={4}
                placeholder='input messages... (Shift+Enter line break)'
                value={input}
                onChange={(e)=>setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                variant='outlined'
                size="small"
                />
                <IconButton
                color='primary'
                onClick={handleSend}
                disabled={!input.trim()||loading}
                sx={{
                    backgroundColor: "primary.main",
                    color:"white",
                    "&:hover":{
                        backgroundColor:"primary.dark"
                    },
                    "&:disabled":{
                        backgroundColor:"action.disabledBackground"
                    }
                }}>
                    {loading?<CircularProgress size={24} color="inherit" />: <SendIcon/>}
                </IconButton>
            </Box>
        </Box>
    </Paper>
   );
}

// message bubble components
function MessageBubble({message}){
    const isUser = message.role === "user";
    return (
        <Box
        sx={{
            display:'flex',
            justifyContent:isUser?"flex-end":"flex-start",
            mb:2
        }}
        >
            <Box
            sx={{
               display:"flex",
               flexDirection:isUser?"row-reverse":"row",
               gap:1,
               maxWidth:"70%"
            }}
            >
                {/**avatar */}
                <Avatar
                 sx={{
                    bgcolor:isUser?"primary.main":"secondary.main",
                    width:36,
                    height:36
                 }}
                >
                    {isUser?<PersonIcon/>:<SmartToyIcon/>}
                </Avatar>
                {/**message content */}
                <Paper
                 elevation={1}
                 sx={{
                    p:2,
                    backgroundColor:isUser?"primary.light":"white",
                    color:isUser?"white":"text.primary",
                    borderRadius:2
                 }}
                >
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                    {/**timestamp and token */}
                    <Box sx={{mt:1,display:"flex",gap:1,flexWrap:"wrap"}}>
                        <Chip
                          label={new Date(message.timestamp).toLocaleTimeString()}
                          size="small"
                          sx={{
                            height:20,
                            fontSize:"0.7rem",
                            backgroundColor:isUser?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.05)"
                          }}
                        />
                            {message.usage&&(
                                <Chip 
                                label={`Tokens:${message.usage.total_tokens}`}
                                size='small'
                                sx={{
                                    height:20,
                                    fontSize:"0.7rem",
                                    backgroundColor:isUser?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.05)"
                                }}/>
                            )}
                        
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
}

export default ChatInterface;