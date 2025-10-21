import express ,{Request,Response} from 'express';
import jsonwebtoken from 'jsonwebtoken';
import { PrismaClient } from './generated/prisma';
const app=express();
const prisma=new PrismaClient();
const port =process.env.PORT || 3000;



app.use(express.json());
app.use(express.urlencoded({extended:true}));


app.get("/",(req:Request,res:Response)=>{
    res.send("Welcome to Job Portal API");
   } )

app.post("/auth/register",async (req:Request,res:Response)=>{
    const {username,email,password}=req.body;
    if(!username || !email || !password){
        return res.status(400).json({message:"All fields are required"});
    }
    try{
        const existingUser=await prisma.user.findUnique({
            where:{email}
        });
        if(existingUser){
            return res.status(409).json({message:"User already exists"});
        }
        const user=await prisma.user.create({
            data:{name:username,email,password}
        });
        const token=jsonwebtoken.sign({id:user.id},process.env.JWT_SECRET as string);
        res.status(201).json({"message":"Successfully created a new userq",user,token});
        }catch(error){res.status(500).json({"message":"Error while registering a new user",error});
    }})


//company routes
app.get("/companies",async(req:Request,res:Response)=>{
    try{
        const companies=await prisma.company.findMany();
        res.status(200).json(companies);
    }catch(error){
        res.status(500).json({"message":"Error while fetching companies",error});
    }
});


app.post("/companies",async(req:Request,res:Response)=>{
  const {name,location,}
});


   app.listen(port,()=>{
    console.log(`Server is running at http://localhost:${port}`);
   });