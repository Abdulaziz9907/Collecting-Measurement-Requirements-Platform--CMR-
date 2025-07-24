import './login.css';

import React, {useState} from "react";
export default (props) => {
	const [input1, onChangeInput1] = useState('');
	const [input2, onChangeInput2] = useState('');
	return (
		<div className="contain">
			<div className="scroll-view">
				<div className="column">
					<div className="row-view">
						<img
							src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/lr49i5w1_expires_30_days.png"} 
							className="image"
						/>
						<div className="row-view2">
							<div className="view">
								<div className="column2">
									<span className="text" >
										{"للتواصل"}
									</span>
									<div className="view2">
										<div className="box">
										</div>
									</div>
								</div>
							</div>
							<div className="view">
								<div className="column2">
									<div className="view2">
										<div className="box">
										</div>
									</div>
									<span className="text" >
										{"عن المنصة"}
									</span>
								</div>
							</div>
							<span className="text2" >
								{"الرئيسية"}
							</span>
						</div>
						<div className="box2">
						</div>
						<span className="text3" >
							{"منصة جمع متطلبات قياس"}
						</span>
						<img
							src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/3w0hbwu4_expires_30_days.png"} 
							className="image2"
						/>
					</div>
					<div className="row-view3"
						style={{
							backgroundImage: 'url(https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/hfye9b1p_expires_30_days.png)',
						}}
						>
						<div className="column3">
							<div className="view3">
								<span className="text4" >
									{"عن التحول الرقمي"}
								</span>
							</div>
							<span className="text5" >
								{"التحول الرقمي هو استخدام التكنولوجيا لتحسين الخدمات والعمليات، مثل تحويل المعاملات الورقية إلى إلكترونية، بهدف زيادة الكفاءة وتسهيل حياة الأفراد."}
							</span>
							<div className="row-view4">
								<img
									src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/oiayap0x_expires_30_days.png"} 
									className="image3"
								/>
								<div className="row-view5">
									<img
										src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/1csa65nz_expires_30_days.png"} 
										className="image4"
									/>
									<img
										src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/n7cxzp26_expires_30_days.png"} 
										className="image5"
									/>
									<img
										src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/inhn8lup_expires_30_days.png"} 
										className="image5"
									/>
									<img
										src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/rmojleul_expires_30_days.png"} 
										className="image5"
									/>
									<img
										src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/2ne99t4d_expires_30_days.png"} 
										className="image5"
									/>
								</div>
								<img
									src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/hqgs7uof_expires_30_days.png"} 
									className="image3"
								/>
							</div>
						</div>
						<div className="column4"
							style={{
								backgroundImage: 'url(https://i.imgur.com/1tMFzp8.png)',
							}}
							>
							<div className="view4">
								<span className="text6" >
									{"تسجيل دخول"}
								</span>
							</div>
							<input
								placeholder={"اسم المستخدم"}
								value={input1}
								onChange={(event)=>onChangeInput1(event.target.value)}
								className="input"
							/>
							<input
								placeholder={"كلمة المرور"}
								value={input2}
								onChange={(event)=>onChangeInput2(event.target.value)}
								className="input2"
							/>
							<div className="view5">
								<span className="text7" >
									{"نسيت كلمة المرور؟"}
								</span>
							</div>
							<button className="button"
								onClick={()=>alert("Pressed!")}>
								<span className="text8" >
									{"دخول"}
								</span>
							</button>
						</div>
						<img
							src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/92zky7kf_expires_30_days.png"} 
							className="absolute-image"
						/>
					</div>
					<div className="column5">
						<div className="view6">
							<span className="text9" >
								{"منصة جمع متطلبات قياس"}
							</span>
						</div>
						<div className="view2">
							<img
								src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/a7xc4gag_expires_30_days.png"} 
								className="image6"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}